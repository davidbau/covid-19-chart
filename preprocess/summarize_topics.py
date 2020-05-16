#!/usr/bin/env pythono3

import csv

with open('metadata.csv') as f:
    dr = csv.DictReader(f)
    for r in dr:
        # print(r['abstract'])
        print(r['publish_time'])
