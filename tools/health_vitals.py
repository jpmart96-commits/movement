#!/usr/bin/env python3
"""Apple Health export -> Movement vitals file.

    python tools/health_vitals.py export.zip            # writes vitals.json next to it
    python tools/health_vitals.py export.zip -o out.json

Reads the export straight out of the zip (no need to unzip the ~400 MB XML)
and keeps four daily series: resting HR, HRV, VO2 max and sleep. Everything
else in the export is ignored. The result is ~15 KB and is what Settings ->
"Import vitals" in the app reads; the app merges it by date, so re-running
this on a newer export and importing again only adds/refreshes days.

Health data stays out of git: export.zip, apple_health_export/ and
vitals*.json are in .gitignore. The app stores the merged series in your
own Supabase row (overrides.store_key = 'vitals'), behind RLS.

Day attribution (local time, as the export records it):
  rhr    Apple's daily resting HR, filed on the day the sample window ENDS
  hrv    mean of that day's SDNN readings (ms); hrvN = how many readings
  vo2    last estimate that day (Apple only estimates after outdoor walks/runs)
  sleep  minutes asleep (core+deep+REM+unspecified, overlaps merged), filed
         on the WAKE date; deep/rem kept alongside
  weight last body-mass reading that day, kg (lb converted); fat = body-fat %
         when a scale records it

  --since YYYY-MM-DD   only write days from that date on (smaller file; the
                       app merges by date either way)
Standard library only.
"""
import argparse, json, os, statistics, sys, zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timedelta, timezone

T = 'HKQuantityTypeIdentifier'
FMT = '%Y-%m-%d %H:%M:%S %z'


def parse(stream):
    rhr, hrv, vo2 = defaultdict(list), defaultdict(list), {}
    weight, fat = {}, {}               # date -> (time, value): last reading wins
    sleep = defaultdict(list)          # wake date -> [(start, end, stage)]
    for _, el in ET.iterparse(stream, events=('end',)):
        if el.tag != 'Record':
            if el.tag in ('Workout', 'ActivitySummary', 'Correlation'):
                el.clear()
            continue
        t = el.get('type')
        if t == T + 'RestingHeartRate':
            end = datetime.strptime(el.get('endDate'), FMT)
            rhr[end.strftime('%Y-%m-%d')].append(float(el.get('value')))
        elif t == T + 'HeartRateVariabilitySDNN':
            d = datetime.strptime(el.get('startDate'), FMT)
            hrv[d.strftime('%Y-%m-%d')].append(float(el.get('value')))
        elif t == T + 'VO2Max':
            d = datetime.strptime(el.get('startDate'), FMT)
            vo2[d.strftime('%Y-%m-%d')] = float(el.get('value'))
        elif t == T + 'BodyMass':
            d = datetime.strptime(el.get('startDate'), FMT)
            v = float(el.get('value'))
            unit = (el.get('unit') or 'kg').lower()
            if unit in ('lb', 'lbs'):
                v *= 0.45359237
            elif unit == 'g':
                v /= 1000
            k = d.strftime('%Y-%m-%d')
            if k not in weight or d >= weight[k][0]:
                weight[k] = (d, v)
        elif t == T + 'BodyFatPercentage':
            d = datetime.strptime(el.get('startDate'), FMT)
            v = float(el.get('value'))
            k = d.strftime('%Y-%m-%d')
            if k not in fat or d >= fat[k][0]:
                fat[k] = (d, v * 100 if v <= 1 else v)
        elif t == 'HKCategoryTypeIdentifierSleepAnalysis':
            stage = el.get('value', '').replace('HKCategoryValueSleepAnalysis', '')
            if stage.startswith('Asleep'):
                s = datetime.strptime(el.get('startDate'), FMT)
                e = datetime.strptime(el.get('endDate'), FMT)
                wake = e if e.hour < 18 else e + timedelta(days=1)
                sleep[wake.strftime('%Y-%m-%d')].append((s, e, stage))
        el.clear()

    days = defaultdict(dict)
    for d, v in rhr.items():
        days[d]['rhr'] = round(statistics.mean(v))
    for d, v in hrv.items():
        days[d]['hrv'] = round(statistics.mean(v), 1)
        days[d]['hrvN'] = len(v)
    for d, v in vo2.items():
        days[d]['vo2'] = round(v, 1)
    for d, (_, v) in weight.items():
        days[d]['weight'] = round(v, 1)
    for d, (_, v) in fat.items():
        days[d]['fat'] = round(v, 1)
    for d, segs in sleep.items():
        segs.sort()
        total, cur_s, cur_e = 0.0, None, None
        for s, e, _ in segs:                       # union of intervals
            if cur_e is None or s > cur_e:
                if cur_e is not None:
                    total += (cur_e - cur_s).total_seconds()
                cur_s, cur_e = s, e
            else:
                cur_e = max(cur_e, e)
        if cur_e is not None:
            total += (cur_e - cur_s).total_seconds()
        mins = round(total / 60)
        if mins < 60:                              # a stray nap isn't a night
            continue
        days[d]['sleep'] = mins
        days[d]['deep'] = round(sum((e - s).total_seconds() for s, e, st in segs if st == 'AsleepDeep') / 60)
        days[d]['rem'] = round(sum((e - s).total_seconds() for s, e, st in segs if st == 'AsleepREM') / 60)
    return dict(sorted(days.items()))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('src', help='export.zip or export.xml')
    ap.add_argument('-o', '--out', help='output path (default: vitals.json beside src)')
    ap.add_argument('--since', help='only days on or after YYYY-MM-DD')
    a = ap.parse_args()
    if a.src.lower().endswith('.zip'):
        z = zipfile.ZipFile(a.src)
        name = next(n for n in z.namelist() if n.endswith('/export.xml') or n == 'export.xml')
        stream = z.open(name)
    else:
        stream = open(a.src, 'rb')
    days = parse(stream)
    if a.since:
        days = {k: v for k, v in days.items() if k >= a.since}
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.src)), 'vitals.json')
    doc = {
        'kind': 'movement-vitals', 'version': 1, 'source': 'apple-health',
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'range': [next(iter(days), None), next(reversed(days), None)] if days else None,
        'days': days,
    }
    with open(out, 'w') as f:
        json.dump(doc, f, separators=(',', ':'))
    n = {k: sum(1 for v in days.values() if k in v) for k in ('rhr', 'hrv', 'vo2', 'sleep', 'weight')}
    print(f'{out}: {len(days)} days {doc["range"]} — ' + ', '.join(f'{k} {v}' for k, v in n.items()))


if __name__ == '__main__':
    sys.exit(main())
