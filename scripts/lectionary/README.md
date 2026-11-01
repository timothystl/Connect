# Scheduler lectionary calendar

The Scheduler's Sunday and festival readings (and the readings the Lector and
Liturgist get by email) come from `src/lectionary.js`, with identical copies in
`lcms_calendar.json` and `scheduler/lcms_calendar.json`. Do not edit those by hand;
rebuild them:

```sh
node scripts/lectionary/build-calendar.mjs --report
```

## Sources

1. **LCMS yearly calendars** — the Commission on Worship's "Church Year Calendar,
   Three-Year Series" Word files, linked from
   <https://www.lcms.org/worship/church-year>. A church year covered by one of these
   is copied date for date, including its festivals and "or" alternatives.
   All of them together also supply readings for later years.
2. **yaag-base.json** — the older yaag.org scrape. It decides which Sunday falls on
   which date in years LCMS has not published yet, and supplies readings only where no
   LCMS calendar has them (each such entry says `"source": "yaag.org"`).

Festivals with LCMS readings on file are added on their dates. Reformation and
All Saints are observed on the nearest Sunday, as every LCMS calendar does. Any other
festival that falls on a Sunday becomes an `alternates` choice, which the Scheduler's
readings panel offers with a "Use these readings" button.

## Adding a new year's LCMS calendar

LCMS publishes the next year's calendar each fall. Download the Three-Year Series
Word file, then:

```sh
python3 scripts/lectionary/parse-lcms-docx.py /tmp/rows-new.json <new>.docx
```

Merge the new rows into `lcms-official-rows.json` (or re-run the parser on every
calendar file at once), run the build, check the `--report` output, and run `npm test`.

Not yet covered, because no LCMS calendar on file lists their readings: St. Andrew,
St. Thomas, St. Titus, St. Matthias, St. Joseph, the Annunciation, St. Philip and
St. James, the Visitation, St. Barnabas, the Nativity of St. John the Baptist,
St. Mary Magdalene, St. James of Jerusalem, and St. Simon and St. Jude.
