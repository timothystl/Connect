"""Parse LCMS Commission on Worship church-year calendars (Three-Year Series, .docx)
into rows. Usage: python3 parse-lcms-docx.py OUT.json CAL1.docx [CAL2.docx ...]
Source files: https://www.lcms.org/worship/church-year (Series A/B/C calendars with readings)."""
import docx, sys, json, re
MON={'jan':1,'feb':2,'mar':3,'march':3,'apr':4,'april':4,'may':5,'june':6,'jun':6,'july':7,'jul':7,'aug':8,'sept':9,'sep':9,'oct':10,'nov':11,'dec':12}
def clean(s): return re.sub(r'\s+',' ',s.replace('\n',' / ')).strip(' /').strip()
out=[]
for f in sys.argv[2:]:
    name=f.split('/')[-1]
    y0=int(re.search(r'(\d{4})-\d{4}',name).group(1)); ser=re.search(r'Series-([ABC])',name).group(1)
    t=docx.Document(f).tables[0]; cur=None
    for r in t.rows[1:]:
        c=[x.text for x in r.cells]
        if 'New Church Year' in c[0]: break   # next year's preview: covered by that year's own calendar
        d=clean(c[1]); alt=False
        m=re.match(r'([A-Za-z]+)\.? (\d+)',d)
        if m:
            mo=MON[m.group(1).lower()]; dy=int(m.group(2))
            # Advent starts in Nov/Dec of y0; the year runs to the next Advent, so a Nov/Dec
            # date after the calendar has reached January belongs to y0+1.
            seen_jan = cur is not None and cur[:4]==str(y0+1)
            yr = y0+1 if (mo<11 or seen_jan) else y0
            cur='%04d-%02d-%02d'%(yr,mo,dy)
        elif d.lower().startswith('or'): alt=True
        prop=re.search(r'Prop\. (\d+)',d)
        out.append(dict(source=name,series=ser,date=cur,alt=alt,name=clean(c[2]),prop=int(prop.group(1)) if prop else None,
            ot=clean(c[3]),psalm=clean(c[4]),epistle=clean(c[5]),gospel=clean(c[6])))
json.dump(out,open(sys.argv[1],'w'),indent=1,ensure_ascii=False)
print(len(out),'rows')
