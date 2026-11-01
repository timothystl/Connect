// ── LCMS Lectionary Calendar ──────────────────────────────────────────────────
// Bundled inline for reliability — avoids dependency on GitHub raw CDN.
// Served at /scheduler/lcms_calendar.json
export const LCMS_CALENDAR_JSON = `{
  "meta": {
    "description": "LCMS LSB Three-Year lectionary calendar for the Scheduler. Built by scripts/lectionary/build-calendar.mjs.",
    "sources": [
      "LCMS Commission on Worship yearly Church Year Calendars (Three-Year Series), lcms.org/worship/church-year: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx, LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx are used date for date; all LCMS calendars on file supply readings for later years.",
      "yaag.org scrape (2026-03-12): which Sunday falls on which date in later years, and readings only where no LCMS calendar has them yet (source \\"yaag.org\\")."
    ],
    "note": "Each entry's \\"source\\" says where its readings came from. \\"alternates\\" are the LCMS calendar's \\"or\\" choices for that date. References keep the first option only; parentheses mark optional verses."
  },
  "calendar": {
    "2025-11-30": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 122",
      "ot": "Isaiah 2:1-5",
      "epistle": "Romans 13:(8-10) 11-14",
      "gospel": "Matthew 21:1-11",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2025-12-07": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 72:1-7",
      "ot": "Isaiah 11:1-10",
      "epistle": "Romans 15:4-13",
      "gospel": "Matthew 3:1-12",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2025-12-14": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:1-10",
      "epistle": "James 5:7-11",
      "gospel": "Matthew 11:2-15",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2025-12-21": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 24",
      "ot": "Isaiah 7:10-17",
      "epistle": "Romans 1:1-7",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2025-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2025-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2025-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2025-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "First Sunday after Christmas",
          "psalm": "Psalm 111",
          "ot": "Isaiah 63:7-14",
          "epistle": "Galatians 4:4-7",
          "gospel": "Matthew 2:13-23"
        }
      ]
    },
    "2025-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "",
      "churchYear": "",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "",
      "churchYear": "",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-01-04": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-01-11": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 29",
      "ot": "Isaiah 42:1-9",
      "epistle": "Romans 6:1-11",
      "gospel": "Matthew 3:13-17",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-01-18": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Isaiah 49:1-7",
      "epistle": "1 Corinthians 1:1-9",
      "gospel": "John 1:29-42a",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Confession of St. Peter",
          "psalm": "Psalm 118:19-29",
          "ot": "Acts 4:8-13",
          "epistle": "2 Peter 1:1-15",
          "gospel": "Mark 8:27-35 (36-9:1)"
        }
      ]
    },
    "2026-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-01-25": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 27:1-9 (10-14)",
      "ot": "Isaiah 9:1-4",
      "epistle": "1 Corinthians 1:10-18",
      "gospel": "Matthew 4:12-25",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Conversion of St. Paul",
          "psalm": "Psalm 67",
          "ot": "Acts 9:1-22",
          "epistle": "Galatians 1:11-24",
          "gospel": "Matthew 19:27-30"
        }
      ]
    },
    "2026-02-01": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 15",
      "ot": "Micah 6:1-8",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2026-02-08": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 112:1-9",
      "ot": "Isaiah 58:3-9a",
      "epistle": "1 Corinthians 2:1-12 (13-16)",
      "gospel": "Matthew 5:13-20",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-02-15": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 2:6-12",
      "ot": "Exodus 24:8-18",
      "epistle": "2 Peter 1:16-21",
      "gospel": "Matthew 17:1-9",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-02-18": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-02-22": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Genesis 3:1-21",
      "epistle": "Romans 5:12-19",
      "gospel": "Matthew 4:1-11",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-03-01": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Genesis 12:1-9",
      "epistle": "Romans 4:1-8, 13-17",
      "gospel": "John 3:1-17",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-03-08": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 95:1-9",
      "ot": "Exodus 17:1-7",
      "epistle": "Romans 5:1-8",
      "gospel": "John 4:5-26 (27-30, 39-42)",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-03-15": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 142",
      "ot": "Isaiah 42:14-21",
      "epistle": "Ephesians 5:8-14",
      "gospel": "John 9:1-41",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-03-22": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 130",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Romans 8:1-11",
      "gospel": "John 11:1-45 (46-53)",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-03-29": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 118:19-29",
      "ot": "Isaiah 50:4-9a",
      "epistle": "Philippians 2:5-11",
      "gospel": "Matthew 26:1-27:66",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-04-02": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "Hebrews 9:11-22",
      "gospel": "Matthew 26:17-30",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-04-03": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-04-05": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 16",
      "ot": "Acts 10:34-43",
      "epistle": "Colossians 3:1-4",
      "gospel": "Matthew 28:1-10",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 14:10-15:1",
          "epistle": "1 Corinthians 15:1-11",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2026-04-12": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 148",
      "ot": "Acts 5:29-42",
      "epistle": "1 Peter 1:3-9",
      "gospel": "John 20:19-31",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-04-19": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 116:1-14",
      "ot": "Acts 2:14a, 36-41",
      "epistle": "1 Peter 1:17-25",
      "gospel": "Luke 24:13-35",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-04-26": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Acts 2:42-47",
      "epistle": "1 Peter 2:19-25",
      "gospel": "John 10:1-10",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-05-03": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Acts 6:1-9; 7:2a, 51-60",
      "epistle": "1 Peter 2:2-10",
      "gospel": "John 14:1-14",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-05-10": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 66:8-20",
      "ot": "Acts 17:16-31",
      "epistle": "1 Peter 3:13-22",
      "gospel": "John 14:15-21",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-05-14": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-05-17": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 68:1-10",
      "ot": "Acts 1:12-26",
      "epistle": "1 Peter 4:12-19; 5:6-11",
      "gospel": "John 17:1-11",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-05-24": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 25:1-15",
      "ot": "Numbers 11:24-30",
      "epistle": "Acts 2:1-21",
      "gospel": "John 7:37-39",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-05-31": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Genesis 1:1-2:4a",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "Matthew 28:16-20",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-06-07": {
      "sundayName": "2nd Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 119:65-72",
      "ot": "Hosea 5:15-6:6",
      "epistle": "Romans 4:13-25",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-06-14": {
      "sundayName": "3rd Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 100",
      "ot": "Exodus 19:2-8",
      "epistle": "Romans 5:6-15",
      "gospel": "Matthew 9:35-10:8 (9-20)",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-06-21": {
      "sundayName": "4th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 91:1-10 (11-16)",
      "ot": "Jeremiah 20:7-13",
      "epistle": "Romans 6:12-23",
      "gospel": "Matthew 10:5a, 21-33",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-06-28": {
      "sundayName": "5th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 119:153-160",
      "ot": "Jeremiah 28:5-9",
      "epistle": "Romans 7:1-13",
      "gospel": "Matthew 10:34-42",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2026-07-05": {
      "sundayName": "6th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 145:1-14",
      "ot": "Zechariah 9:9-12",
      "epistle": "Romans 7:14-25a",
      "gospel": "Matthew 11:25-30",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-07-12": {
      "sundayName": "7th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 65:(1-8) 9-13",
      "ot": "Isaiah 55:10-13",
      "epistle": "Romans 8:12-17",
      "gospel": "Matthew 13:1-9, 18-23",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-07-19": {
      "sundayName": "8th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 119:57-64",
      "ot": "Isaiah 44:6-8",
      "epistle": "Romans 8:18-27",
      "gospel": "Matthew 13:24-30, 36-43",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-07-26": {
      "sundayName": "9th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 125",
      "ot": "Deuteronomy 7:6-9",
      "epistle": "Romans 8:28-39",
      "gospel": "Matthew 13:44-52",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-08-02": {
      "sundayName": "10th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 136:1-9 (23-26)",
      "ot": "Isaiah 55:1-5",
      "epistle": "Romans 9:1-5 (6-13)",
      "gospel": "Matthew 14:13-21",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-08-09": {
      "sundayName": "11th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 18:1-6 (7-16)",
      "ot": "Job 38:4-18",
      "epistle": "Romans 10:5-17",
      "gospel": "Matthew 14:22-33",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-08-16": {
      "sundayName": "12th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Isaiah 56:1, 6-8",
      "epistle": "Romans 11:1-2a, 13-15, 28-32",
      "gospel": "Matthew 15:21-28",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-08-23": {
      "sundayName": "13th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 138",
      "ot": "Isaiah 51:1-6",
      "epistle": "Romans 11:33-12:8",
      "gospel": "Matthew 16:13-20",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2026-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-08-30": {
      "sundayName": "14th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 26",
      "ot": "Jeremiah 15:15-21",
      "epistle": "Romans 12:9-21",
      "gospel": "Matthew 16:21-28",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-09-06": {
      "sundayName": "15th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Ezekiel 33:7-9",
      "epistle": "Romans 13:1-10",
      "gospel": "Matthew 18:1-20",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-09-13": {
      "sundayName": "16th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 103:1-12",
      "ot": "Genesis 50:15-21",
      "epistle": "Romans 14:1-12",
      "gospel": "Matthew 18:21-35",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2026-09-20": {
      "sundayName": "17th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 27:1-9",
      "ot": "Isaiah 55:6-9",
      "epistle": "Philippians 1:12-14, 19-30",
      "gospel": "Matthew 20:1-16",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2026-09-27": {
      "sundayName": "18th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 25:1-10",
      "ot": "Ezekiel 18:1-4, 25-32",
      "epistle": "Philippians 2:1-4 (5-13) 14-18",
      "gospel": "Matthew 21:23-27 (28-32)",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "",
      "churchYear": "",
      "series": "A",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-10-04": {
      "sundayName": "19th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 80:7-19",
      "ot": "Isaiah 5:1-7",
      "epistle": "Philippians 3:4b-14",
      "gospel": "Matthew 21:33-46",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-10-11": {
      "sundayName": "20th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Isaiah 25:6-9",
      "epistle": "Philippians 4:4-13",
      "gospel": "Matthew 22:1-14",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-10-18": {
      "sundayName": "21st Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 96:1-9 (10-13)",
      "ot": "Isaiah 45:1-7",
      "epistle": "1 Thessalonians 1:1-10",
      "gospel": "Matthew 22:15-22",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "St. Luke, Evangelist",
          "psalm": "Psalm 147:1-11",
          "ot": "Isaiah 35:5-8",
          "epistle": "2 Timothy 4:5-18",
          "gospel": "Luke 10:1-9"
        }
      ]
    },
    "2026-10-25": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "Matthew 11:12-19",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop25)",
          "psalm": "Psalm 1",
          "ot": "Leviticus 19:1-2, 15-18",
          "epistle": "1 Thessalonians 2:1-13",
          "gospel": "Matthew 22:34-46"
        }
      ]
    },
    "2026-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-11-08": {
      "sundayName": "24th Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 70",
      "ot": "Amos 5:18-24",
      "epistle": "1 Thessalonians 4:13-18",
      "gospel": "Matthew 25:1-13",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-11-15": {
      "sundayName": "25th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Zephaniah 1:7-16",
      "epistle": "1 Thessalonians 5:1-11",
      "gospel": "Matthew 25:14-30",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-11-22": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 95:1-7a",
      "ot": "Ezekiel 34:11-16, 20-24",
      "epistle": "1 Corinthians 15:20-28",
      "gospel": "Matthew 25:31-46",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-11-26": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2026",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS calendar: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-11-29": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 80:1-7",
      "ot": "Isaiah 64:1-9",
      "epistle": "1 Corinthians 1:3-9",
      "gospel": "Mark 11:1-10",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-12-06": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 85",
      "ot": "Isaiah 40:1-11",
      "epistle": "2 Peter 3:8-14",
      "gospel": "Mark 1:1-8",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-12-13": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 126",
      "ot": "Isaiah 61:1-4, 8-11",
      "epistle": "1 Thessalonians 5:16-24",
      "gospel": "John 1:6-8, 19-28",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-12-20": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 89:1-5 (19-29)",
      "ot": "2 Samuel 7:1-11, 16",
      "epistle": "Romans 16:25-27",
      "gospel": "Luke 1:26-38",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2026-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2026-12-27": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Isaiah 61:10-62:3",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 2:22-40",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "St. John, Apostle and Evangelist",
          "psalm": "Psalm 11",
          "ot": "Revelation 1:1-6",
          "epistle": "1 John 1:1-2:2",
          "gospel": "John 21:20-25"
        }
      ]
    },
    "2026-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2026-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "",
      "churchYear": "",
      "series": "B",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "",
      "churchYear": "",
      "series": "B",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-01-03": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-01-10": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Genesis 1:1-5",
      "epistle": "Romans 6:1-11",
      "gospel": "Mark 1:4-11",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-01-17": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 139:1-10",
      "ot": "1 Samuel 3:1-10 (11-20)",
      "epistle": "1 Corinthians 6:12-20",
      "gospel": "John 1:43-51",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2027-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "Third Sunday after the Epiphany",
          "psalm": "Psalm 62",
          "ot": "Jonah 3:1-5, 10",
          "epistle": "1 Corinthians 7:29-31 (32-35)",
          "gospel": "Mark 1:14-20"
        }
      ]
    },
    "2027-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2027-01-31": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Deuteronomy 18:15-20",
      "epistle": "1 Corinthians 8:1-13",
      "gospel": "Mark 1:21-28",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-02-07": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 50:1-6",
      "ot": "2 Kings 2:1-12",
      "epistle": "2 Corinthians 3:12-13 (14-18); 4:1-6",
      "gospel": "Mark 9:2-9",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-02-10": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-02-14": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 25:1-10",
      "ot": "Genesis 22:1-18",
      "epistle": "James 1:12-18",
      "gospel": "Mark 1:9-15",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-02-21": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 22:23-31",
      "ot": "Genesis 17:1-7, 15-16",
      "epistle": "Romans 5:1-11",
      "gospel": "Mark 8:27-38",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-02-28": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 19",
      "ot": "Exodus 20:1-17",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "John 2:13-22 (23-25)",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-03-07": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 107:1-9",
      "ot": "Numbers 21:4-9",
      "epistle": "Ephesians 2:1-10",
      "gospel": "John 3:14-21",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-03-14": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 5:1-10",
      "gospel": "Mark 10:(32-34) 35-45",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-03-21": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Zechariah 9:9-12",
      "epistle": "Philippians 2:5-11",
      "gospel": "Mark 14:1-15:47",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-03-25": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "1 Corinthians 10:16-17",
      "gospel": "Mark 14:12-26",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-03-26": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-03-28": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Isaiah 25:6-9",
      "epistle": "1 Corinthians 15:1-11",
      "gospel": "Mark 16:1-8",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 15:1-11",
          "epistle": "1 Corinthians 5:6b-8",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2027-04-04": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 148",
      "ot": "Acts 4:32-35",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 20:19-31",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-04-11": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 4",
      "ot": "Acts 3:11-21",
      "epistle": "1 John 3:1-7",
      "gospel": "Luke 24:36-49",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-04-18": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Acts 4:1-12",
      "epistle": "1 John 3:16-24",
      "gospel": "John 10:11-18",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "Fifth Sunday of Easter",
          "psalm": "Psalm 150",
          "ot": "Acts 8:26-40",
          "epistle": "1 John 4:1-11 (12-21)",
          "gospel": "John 15:1-8"
        }
      ]
    },
    "2027-05-02": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 98",
      "ot": "Acts 10:34-48",
      "epistle": "1 John 5:1-8",
      "gospel": "John 15:9-17",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-05-06": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-05-09": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 1",
      "ot": "Acts 1:12-26",
      "epistle": "1 John 5:9-15",
      "gospel": "John 17:11b-19",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-05-16": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 139:1-12 (13-16)",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Acts 2:1-21",
      "gospel": "John 15:26-27; 16:4b-15",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-05-23": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Isaiah 6:1-8",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 3:1-17",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-05-30": {
      "sundayName": "2nd Sunday after Pentecost (prop4)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 81:1-10",
      "ot": "Deuteronomy 5:12-15",
      "epistle": "2 Corinthians 4:5-12",
      "gospel": "Mark 2:23-28 (3:1-6)",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-06-06": {
      "sundayName": "3rd Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 130",
      "ot": "Genesis 3:8-15",
      "epistle": "2 Corinthians 4:13-5:1",
      "gospel": "Mark 3:20-35",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-06-13": {
      "sundayName": "4th Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 1",
      "ot": "Ezekiel 17:22-24",
      "epistle": "2 Corinthians 5:1-10 (11-17)",
      "gospel": "Mark 4:26-34",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-06-20": {
      "sundayName": "5th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 124",
      "ot": "Job 38:1-11",
      "epistle": "2 Corinthians 6:1-13",
      "gospel": "Mark 4:35-41",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-06-27": {
      "sundayName": "6th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 30",
      "ot": "Lamentations 3:22-33",
      "epistle": "2 Corinthians 8:1-9, 13-15",
      "gospel": "Mark 5:21-43",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-07-04": {
      "sundayName": "7th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 123",
      "ot": "Ezekiel 2:1-5",
      "epistle": "2 Corinthians 12:1-10",
      "gospel": "Mark 6:1-13",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-07-11": {
      "sundayName": "8th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 85:(1-7) 8-13",
      "ot": "Amos 7:7-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Mark 6:14-29",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-07-18": {
      "sundayName": "9th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Jeremiah 23:1-6",
      "epistle": "Ephesians 2:11-22",
      "gospel": "Mark 6:30-44",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "10th Sunday after Pentecost (prop12)",
          "psalm": "Psalm 136:1-9",
          "ot": "Genesis 9:8-17",
          "epistle": "Ephesians 3:14-21",
          "gospel": "Mark 6:45-56"
        }
      ]
    },
    "2027-08-01": {
      "sundayName": "11th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 145:10-21",
      "ot": "Exodus 16:2-15",
      "epistle": "Ephesians 4:1-16",
      "gospel": "John 6:22-35",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-08-08": {
      "sundayName": "12th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 34:1-8",
      "ot": "1 Kings 19:1-8",
      "epistle": "Ephesians 4:17-5:2",
      "gospel": "John 6:35-51",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "13th Sunday after Pentecost (prop15)",
          "psalm": "Psalm 34:12-22",
          "ot": "Proverbs 9:1-10",
          "epistle": "Ephesians 5:6-21",
          "gospel": "John 6:51-69"
        }
      ]
    },
    "2027-08-22": {
      "sundayName": "14th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 14",
      "ot": "Isaiah 29:11-19",
      "epistle": "Ephesians 5:22-33",
      "gospel": "Mark 7:1-13",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "15th Sunday after Pentecost (prop17)",
          "psalm": "Psalm 119:129-136",
          "ot": "Deuteronomy 4:1-2, 6-9",
          "epistle": "Ephesians 6:10-20",
          "gospel": "Mark 7:14-23"
        }
      ]
    },
    "2027-09-05": {
      "sundayName": "16th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:4-7a",
      "epistle": "James 2:1-10, 14-18",
      "gospel": "Mark 7:(24-30) 31-37",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-09-12": {
      "sundayName": "17th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 116:1-9",
      "ot": "Isaiah 50:4-10",
      "epistle": "James 3:1-12",
      "gospel": "Mark 9:14-29",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-09-19": {
      "sundayName": "18th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 11:18-20",
      "epistle": "James 3:13-4:10",
      "gospel": "Mark 9:30-37",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-09-26": {
      "sundayName": "19th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 104:27-35",
      "ot": "Numbers 11:4-6, 10-16, 24-29",
      "epistle": "James 5:(1-12) 13-20",
      "gospel": "Mark 9:38-50",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "",
      "churchYear": "",
      "series": "B",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-10-03": {
      "sundayName": "20th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 128",
      "ot": "Genesis 2:18-25",
      "epistle": "Hebrews 2:1-13 (14-18)",
      "gospel": "Mark 10:2-16",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-10-10": {
      "sundayName": "21st Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 90:12-17",
      "ot": "Amos 5:6-7, 10-15",
      "epistle": "Hebrews 3:12-19",
      "gospel": "Mark 10:17-22",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-10-17": {
      "sundayName": "22nd Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Ecclesiastes 5:10-20",
      "epistle": "Hebrews 4:1-13 (14-16)",
      "gospel": "Mark 10:23-31",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2027-10-24": {
      "sundayName": "23rd Sunday after Pentecost (prop25)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 126",
      "ot": "Jeremiah 31:7-9",
      "epistle": "Hebrews 7:23-28",
      "gospel": "Mark 10:46-52",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-11-07": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "25th Sunday after Pentecost (prop27)",
          "psalm": "Psalm 146",
          "ot": "1 Kings 17:8-16",
          "epistle": "Hebrews 9:24-28",
          "gospel": "Mark 12:38-44"
        }
      ]
    },
    "2027-11-14": {
      "sundayName": "26th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Daniel 12:1-3",
      "epistle": "Hebrews 10:11-25",
      "gospel": "Mark 13:1-13",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-11-21": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 93",
      "ot": "Isaiah 51:4-6",
      "epistle": "Jude 20-25",
      "gospel": "Mark 13:24-37",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-11-25": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2027",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS calendar: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-11-28": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 25:1-10",
      "ot": "Jeremiah 33:14-16",
      "epistle": "1 Thessalonians 3:9-13",
      "gospel": "Luke 19:28-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-12-05": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 66:1-12",
      "ot": "Malachi 3:1-7b",
      "epistle": "Philippians 1:2-11",
      "gospel": "Luke 3:1-14 (15-20)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-12-12": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Zephaniah 3:14-20",
      "epistle": "Philippians 4:4-7",
      "gospel": "Luke 7:18-28 (29-35)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-12-19": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 80:1-7",
      "ot": "Micah 5:2-5a",
      "epistle": "Hebrews 10:5-10",
      "gospel": "Luke 1:39-45 (46-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2027-12-26": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Exodus 13:1-3a, 11-15",
      "epistle": "Colossians 3:12-17",
      "gospel": "Luke 2:22-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2027-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2027-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2027-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-01-02": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-01-09": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 29",
      "ot": "Isaiah 43:1-7",
      "epistle": "Romans 6:1-11",
      "gospel": "Luke 3:15-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-01-16": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 128",
      "ot": "Isaiah 62:1-5",
      "epistle": "1 Corinthians 12:1-11",
      "gospel": "John 2:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-01-23": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 19:(1-6) 7-14",
      "ot": "Nehemiah 8:1-3, 5-6, 8-10",
      "epistle": "1 Corinthians 12:12-31a",
      "gospel": "Luke 4:16-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-01-30": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 71:1-6 ( 7-11 ) ( 12 )",
      "ot": "Jeremiah 1:4-10 ( 17-19 )",
      "epistle": "1 Corinthians 12:31b-13:13",
      "gospel": "Luke 4:31-44",
      "source": "yaag.org"
    },
    "2028-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-02-06": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Isaiah 6:1-8 (9-13)",
      "epistle": "1 Corinthians 14:12b-20",
      "gospel": "Luke 5:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-02-13": {
      "sundayName": "Sixth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Jeremiah 17:5-8",
      "epistle": "1 Corinthians 15:(1-11) 12-20",
      "gospel": "Luke 6:17-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-02-20": {
      "sundayName": "Seventh Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 103:1-13",
      "ot": "Genesis 45:3-15",
      "epistle": "1 Corinthians 15:21-26, 30-42",
      "gospel": "Luke 6:27-38",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-02-27": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 99",
      "ot": "Deuteronomy 34:1-12",
      "epistle": "Hebrews 3:1-6",
      "gospel": "Luke 9:28-36",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-03-01": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:(1-6) 16-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-03-05": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 91:1-13",
      "ot": "Deuteronomy 26:1-11",
      "epistle": "Romans 10:8b-13",
      "gospel": "Luke 4:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-03-12": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 4",
      "ot": "Jeremiah 26:8-15",
      "epistle": "Philippians 3:17-4:1",
      "gospel": "Luke 13:31-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-03-19": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Ezekiel 33:7-20",
      "epistle": "1 Corinthians 10:1-13",
      "gospel": "Luke 13:1-9",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-03-26": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 32",
      "ot": "Isaiah 12:1-6",
      "epistle": "2 Corinthians 5:16-21",
      "gospel": "Luke 15:1-3, 11-32",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-04-02": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 126",
      "ot": "Isaiah 43:16-21",
      "epistle": "Philippians 3:(4b-7) 8-14",
      "gospel": "Luke 20:9-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-04-09": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Deuteronomy 32:36-39",
      "epistle": "Philippians 2:5-11",
      "gospel": "Luke 22:1-23:56",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-04-13": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 116:12-19",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 10:15-25",
      "gospel": "Luke 22:7-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-04-14": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-04-16": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "Isaiah 65:17-25",
      "epistle": "1 Corinthians 15:19-26",
      "gospel": "Luke 24:1-12",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Job 19:23-27",
          "epistle": "1 Corinthians 15:51-57",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2028-04-23": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 5:12-20 (21-32)",
      "epistle": "Revelation 1:4-18",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-04-30": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 30",
      "ot": "Acts 9:1-22",
      "epistle": "Revelation 5:(1-7) 8-14",
      "gospel": "John 21:1-14 (15-19)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-05-07": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 23",
      "ot": "Acts 20:17-35",
      "epistle": "Revelation 7:9-17",
      "gospel": "John 10:22-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-05-14": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 11:1-18",
      "epistle": "Revelation 21:1-7",
      "gospel": "John 16:12-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-05-21": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 16:9-15",
      "epistle": "Revelation 21:9-14, 21-27",
      "gospel": "John 16:23-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-05-25": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-05-28": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 133",
      "ot": "Acts 1:12-26",
      "epistle": "Revelation 22:1-6 (7-11) 12-20",
      "gospel": "John 17:20-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-06-04": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 143",
      "ot": "Genesis 11:1-9",
      "epistle": "Acts 2:1-21",
      "gospel": "John 14:23-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-06-11": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Proverbs 8:1-4, 22-31",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 8:48-59",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-06-18": {
      "sundayName": "2nd Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 32:1-7 ( 2 )",
      "ot": "2 Samuel 11:26-12:10, 13-14",
      "epistle": "Galatians 2:15-21; 3:10-14",
      "gospel": "Luke 7:36-8:3",
      "source": "yaag.org"
    },
    "2028-06-25": {
      "sundayName": "3rd Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 3",
      "ot": "Isaiah 65:1-9",
      "epistle": "Galatians 3:23-4:7",
      "gospel": "Luke 8:26-39",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-07-02": {
      "sundayName": "4th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "1 Kings 19:9b-21",
      "epistle": "Galatians 5:1, 13-25",
      "gospel": "Luke 9:51-62",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-07-09": {
      "sundayName": "5th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 66:1-7",
      "ot": "Isaiah 66:10-14",
      "epistle": "Galatians 6:1-10, 14-18",
      "gospel": "Luke 10:1-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-07-16": {
      "sundayName": "6th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 41",
      "ot": "Leviticus (18:1-5) 19:9-18",
      "epistle": "Colossians 1:1-14",
      "gospel": "Luke 10:25-37",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-07-23": {
      "sundayName": "7th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 27:(1-6) 7-14",
      "ot": "Genesis 18:1-10a (10b-14)",
      "epistle": "Colossians 1:21-29",
      "gospel": "Luke 10:38-42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-07-30": {
      "sundayName": "8th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Genesis 18:(17-19) 20-33",
      "epistle": "Colossians 2:6-15 (16-19)",
      "gospel": "Luke 11:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-08-06": {
      "sundayName": "9th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 100",
      "ot": "Ecclesiastes 1:2, 12-14; 2:18-26",
      "epistle": "Colossians 3:1-11",
      "gospel": "Luke 12:13-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-08-13": {
      "sundayName": "10th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 33:12-22",
      "ot": "Genesis 15:1-6",
      "epistle": "Hebrews 11:1-16",
      "gospel": "Luke 12:22-34 (35-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-08-20": {
      "sundayName": "11th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 119:81-88",
      "ot": "Jeremiah 23:16-29",
      "epistle": "Hebrews 11:17-31 (32-40); 12:1-3",
      "gospel": "Luke 12:49-53 (54-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-08-27": {
      "sundayName": "12th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 50:1-15",
      "ot": "Isaiah 66:18-23",
      "epistle": "Hebrews 12:4-24 (25-29)",
      "gospel": "Luke 13:22-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-09-03": {
      "sundayName": "13th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 131",
      "ot": "Proverbs 25:2-10",
      "epistle": "Hebrews 13:1-17",
      "gospel": "Luke 14:1-14",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-09-10": {
      "sundayName": "14th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Deuteronomy 30:15-20",
      "epistle": "Philemon 1-21",
      "gospel": "Luke 14:25-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-09-17": {
      "sundayName": "15th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 119:169-176",
      "ot": "Ezekiel 34:11-24",
      "epistle": "1 Timothy 1:(5-11) 12-17",
      "gospel": "Luke 15:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-09-24": {
      "sundayName": "16th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 113",
      "ot": "Amos 8:4-7",
      "epistle": "1 Timothy 2:1-15",
      "gospel": "Luke 16:1-15",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-10-01": {
      "sundayName": "17th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Amos 6:1-7",
      "epistle": "1 Timothy 3:1-13",
      "gospel": "Luke 16:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-10-08": {
      "sundayName": "18th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 62",
      "ot": "Habakkuk 1:1-4; 2:1-4",
      "epistle": "2 Timothy 1:1-14",
      "gospel": "Luke 17:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-10-15": {
      "sundayName": "19th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Ruth 1:1-19a",
      "epistle": "2 Timothy 2:1-13",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-10-22": {
      "sundayName": "20th Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Genesis 32:22-30",
      "epistle": "2 Timothy 3:14-4:5",
      "gospel": "Luke 18:1-8",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-10-29": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "21st Sunday after Pentecost (prop25)",
          "psalm": "Psalm 5",
          "ot": "Genesis 4:1-15",
          "epistle": "2 Timothy 4:6-8, 16-18",
          "gospel": "Luke 18:9-17"
        }
      ]
    },
    "2028-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-11-05": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop26)",
          "psalm": "Psalm 130",
          "ot": "Isaiah 1:10-18",
          "epistle": "2 Thessalonians 1:1-5 (6-10) 11-12",
          "gospel": "Luke 19:1-10"
        }
      ]
    },
    "2028-11-12": {
      "sundayName": "23rd Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Exodus 3:1-15",
      "epistle": "2 Thessalonians 2:1-8, 13-17",
      "gospel": "Luke 20:27-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-11-19": {
      "sundayName": "24th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 98",
      "ot": "Malachi 4:1-6",
      "epistle": "2 Thessalonians 3:(1-5) 6-13",
      "gospel": "Luke 21:5-28 (29-36)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-11-23": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-11-26": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2028",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Malachi 3:13-18",
      "epistle": "Colossians 1:13-20",
      "gospel": "Luke 23:27-43",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2028-12-03": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 122",
      "ot": "Isaiah 2:1-5",
      "epistle": "Romans 13:(8-10) 11-14",
      "gospel": "Matthew 21:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-12-10": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 72:1-7",
      "ot": "Isaiah 11:1-10",
      "epistle": "Romans 15:4-13",
      "gospel": "Matthew 3:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-12-17": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:1-10",
      "epistle": "James 5:7-11",
      "gospel": "Matthew 11:2-15",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-12-24": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 24",
      "ot": "Isaiah 7:10-17",
      "epistle": "Romans 1:1-7",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2028-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2028-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2028-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "First Sunday after Christmas",
          "psalm": "Psalm 111",
          "ot": "Isaiah 63:7-14",
          "epistle": "Galatians 4:4-7",
          "gospel": "Matthew 2:13-23"
        }
      ]
    },
    "2029-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-01-07": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 29",
      "ot": "Isaiah 42:1-9",
      "epistle": "Romans 6:1-11",
      "gospel": "Matthew 3:13-17",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-01-14": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Isaiah 49:1-7",
      "epistle": "1 Corinthians 1:1-9",
      "gospel": "John 1:29-42a",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-01-21": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 27:1-9 (10-14)",
      "ot": "Isaiah 9:1-4",
      "epistle": "1 Corinthians 1:10-18",
      "gospel": "Matthew 4:12-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-01-28": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 15",
      "ot": "Micah 6:1-8",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2029-02-04": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 112:1-9",
      "ot": "Isaiah 58:3-9a",
      "epistle": "1 Corinthians 2:1-12 (13-16)",
      "gospel": "Matthew 5:13-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-02-11": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 2:6-12",
      "ot": "Exodus 24:8-18",
      "epistle": "2 Peter 1:16-21",
      "gospel": "Matthew 17:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-02-14": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-02-18": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Genesis 3:1-21",
      "epistle": "Romans 5:12-19",
      "gospel": "Matthew 4:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-02-25": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Genesis 12:1-9",
      "epistle": "Romans 4:1-8, 13-17",
      "gospel": "John 3:1-17",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-03-04": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 95:1-9",
      "ot": "Exodus 17:1-7",
      "epistle": "Romans 5:1-8",
      "gospel": "John 4:5-26 (27-30, 39-42)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-03-11": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 142",
      "ot": "Isaiah 42:14-21",
      "epistle": "Ephesians 5:8-14",
      "gospel": "John 9:1-41",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-03-18": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 130",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Romans 8:1-11",
      "gospel": "John 11:1-45 (46-53)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-03-25": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 118:19-29",
      "ot": "Isaiah 50:4-9a",
      "epistle": "Philippians 2:5-11",
      "gospel": "Matthew 26:1-27:66",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-03-29": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "Hebrews 9:11-22",
      "gospel": "Matthew 26:17-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-03-30": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-04-01": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 16",
      "ot": "Acts 10:34-43",
      "epistle": "Colossians 3:1-4",
      "gospel": "Matthew 28:1-10",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 14:10-15:1",
          "epistle": "1 Corinthians 15:1-11",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2029-04-08": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 148",
      "ot": "Acts 5:29-42",
      "epistle": "1 Peter 1:3-9",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-04-15": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 116:1-14",
      "ot": "Acts 2:14a, 36-41",
      "epistle": "1 Peter 1:17-25",
      "gospel": "Luke 24:13-35",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-04-22": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Acts 2:42-47",
      "epistle": "1 Peter 2:19-25",
      "gospel": "John 10:1-10",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-04-29": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Acts 6:1-9; 7:2a, 51-60",
      "epistle": "1 Peter 2:2-10",
      "gospel": "John 14:1-14",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-05-06": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 66:8-20",
      "ot": "Acts 17:16-31",
      "epistle": "1 Peter 3:13-22",
      "gospel": "John 14:15-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-05-10": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-05-13": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 68:1-10",
      "ot": "Acts 1:12-26",
      "epistle": "1 Peter 4:12-19; 5:6-11",
      "gospel": "John 17:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-05-20": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 25:1-15",
      "ot": "Numbers 11:24-30",
      "epistle": "Acts 2:1-21",
      "gospel": "John 7:37-39",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-05-27": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Genesis 1:1-2:4a",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "Matthew 28:16-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-06-03": {
      "sundayName": "2nd Sunday after Pentecost (prop4)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 4",
      "ot": "Deuteronomy 11:18-21, 26-28",
      "epistle": "Romans 3:21-28",
      "gospel": "Matthew 7:15-29",
      "source": "yaag.org"
    },
    "2029-06-10": {
      "sundayName": "3rd Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 119:65-72",
      "ot": "Hosea 5:15-6:6",
      "epistle": "Romans 4:13-25",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-06-17": {
      "sundayName": "4th Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 100",
      "ot": "Exodus 19:2-8",
      "epistle": "Romans 5:6-15",
      "gospel": "Matthew 9:35-10:8 (9-20)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-06-24": {
      "sundayName": "5th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 91:1-10 (11-16)",
      "ot": "Jeremiah 20:7-13",
      "epistle": "Romans 6:12-23",
      "gospel": "Matthew 10:5a, 21-33",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2029-07-01": {
      "sundayName": "6th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 119:153-160",
      "ot": "Jeremiah 28:5-9",
      "epistle": "Romans 7:1-13",
      "gospel": "Matthew 10:34-42",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-07-08": {
      "sundayName": "7th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 145:1-14",
      "ot": "Zechariah 9:9-12",
      "epistle": "Romans 7:14-25a",
      "gospel": "Matthew 11:25-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-07-15": {
      "sundayName": "8th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 65:(1-8) 9-13",
      "ot": "Isaiah 55:10-13",
      "epistle": "Romans 8:12-17",
      "gospel": "Matthew 13:1-9, 18-23",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-07-22": {
      "sundayName": "9th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 119:57-64",
      "ot": "Isaiah 44:6-8",
      "epistle": "Romans 8:18-27",
      "gospel": "Matthew 13:24-30, 36-43",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-07-29": {
      "sundayName": "10th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 125",
      "ot": "Deuteronomy 7:6-9",
      "epistle": "Romans 8:28-39",
      "gospel": "Matthew 13:44-52",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-08-05": {
      "sundayName": "11th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 136:1-9 (23-26)",
      "ot": "Isaiah 55:1-5",
      "epistle": "Romans 9:1-5 (6-13)",
      "gospel": "Matthew 14:13-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-08-12": {
      "sundayName": "12th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 18:1-6 (7-16)",
      "ot": "Job 38:4-18",
      "epistle": "Romans 10:5-17",
      "gospel": "Matthew 14:22-33",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-08-19": {
      "sundayName": "13th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Isaiah 56:1, 6-8",
      "epistle": "Romans 11:1-2a, 13-15, 28-32",
      "gospel": "Matthew 15:21-28",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2029-08-26": {
      "sundayName": "14th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 138",
      "ot": "Isaiah 51:1-6",
      "epistle": "Romans 11:33-12:8",
      "gospel": "Matthew 16:13-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-09-02": {
      "sundayName": "15th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 26",
      "ot": "Jeremiah 15:15-21",
      "epistle": "Romans 12:9-21",
      "gospel": "Matthew 16:21-28",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-09-09": {
      "sundayName": "16th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Ezekiel 33:7-9",
      "epistle": "Romans 13:1-10",
      "gospel": "Matthew 18:1-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2029-09-16": {
      "sundayName": "17th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 103:1-12",
      "ot": "Genesis 50:15-21",
      "epistle": "Romans 14:1-12",
      "gospel": "Matthew 18:21-35",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2029-09-23": {
      "sundayName": "18th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 27:1-9",
      "ot": "Isaiah 55:6-9",
      "epistle": "Philippians 1:12-14, 19-30",
      "gospel": "Matthew 20:1-16",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-09-30": {
      "sundayName": "19th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 25:1-10",
      "ot": "Ezekiel 18:1-4, 25-32",
      "epistle": "Philippians 2:1-4 (5-13) 14-18",
      "gospel": "Matthew 21:23-27 (28-32)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-10-07": {
      "sundayName": "20th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 80:7-19",
      "ot": "Isaiah 5:1-7",
      "epistle": "Philippians 3:4b-14",
      "gospel": "Matthew 21:33-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-10-14": {
      "sundayName": "21st Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Isaiah 25:6-9",
      "epistle": "Philippians 4:4-13",
      "gospel": "Matthew 22:1-14",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-10-21": {
      "sundayName": "22nd Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 96:1-9 (10-13)",
      "ot": "Isaiah 45:1-7",
      "epistle": "1 Thessalonians 1:1-10",
      "gospel": "Matthew 22:15-22",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-10-28": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "23rd Sunday after Pentecost (prop25)",
          "psalm": "Psalm 1",
          "ot": "Leviticus 19:1-2, 15-18",
          "epistle": "1 Thessalonians 2:1-13",
          "gospel": "Matthew 22:34-46"
        }
      ]
    },
    "2029-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-11-04": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "24th Sunday after Pentecost (prop26)",
          "psalm": "Psalm 43 ( 3 )",
          "ot": "Micah 3:5-12",
          "epistle": "1 Thessalonians 4:1-12",
          "gospel": "Matthew 23:1-12"
        }
      ]
    },
    "2029-11-11": {
      "sundayName": "25th Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 70",
      "ot": "Amos 5:18-24",
      "epistle": "1 Thessalonians 4:13-18",
      "gospel": "Matthew 25:1-13",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-11-18": {
      "sundayName": "26th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Zephaniah 1:7-16",
      "epistle": "1 Thessalonians 5:1-11",
      "gospel": "Matthew 25:14-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-11-22": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-11-25": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2029",
      "series": "A",
      "psalm": "Psalm 95:1-7a",
      "ot": "Ezekiel 34:11-16, 20-24",
      "epistle": "1 Corinthians 15:20-28",
      "gospel": "Matthew 25:31-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-12-02": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 80:1-7",
      "ot": "Isaiah 64:1-9",
      "epistle": "1 Corinthians 1:3-9",
      "gospel": "Mark 11:1-10",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-09": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 85",
      "ot": "Isaiah 40:1-11",
      "epistle": "2 Peter 3:8-14",
      "gospel": "Mark 1:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-16": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 126",
      "ot": "Isaiah 61:1-4, 8-11",
      "epistle": "1 Thessalonians 5:16-24",
      "gospel": "John 1:6-8, 19-28",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-23": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 89:1-5 (19-29)",
      "ot": "2 Samuel 7:1-11, 16",
      "epistle": "Romans 16:25-27",
      "gospel": "Luke 1:26-38",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2029-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2029-12-30": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Isaiah 61:10-62:3",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 2:22-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2029-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-01-13": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Genesis 1:1-5",
      "epistle": "Romans 6:1-11",
      "gospel": "Mark 1:4-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2030-01-20": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 139:1-10",
      "ot": "1 Samuel 3:1-10 (11-20)",
      "epistle": "1 Corinthians 6:12-20",
      "gospel": "John 1:43-51",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2030-01-27": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 62",
      "ot": "Jonah 3:1-5, 10",
      "epistle": "1 Corinthians 7:29-31 (32-35)",
      "gospel": "Mark 1:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-02-03": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Deuteronomy 18:15-20",
      "epistle": "1 Corinthians 8:1-13",
      "gospel": "Mark 1:21-28",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-02-10": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 147:1-11 ( 5 )",
      "ot": "Isaiah 40:21-31",
      "epistle": "1 Corinthians 9:16-27",
      "gospel": "Mark 1:29-39",
      "source": "yaag.org"
    },
    "2030-02-17": {
      "sundayName": "Sixth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 30 ( 2 )",
      "ot": "2 Kings 5:1-14",
      "epistle": "1 Corinthians 10:( 19-30 ) 31-11:1",
      "gospel": "Mark 1:40-45",
      "source": "yaag.org"
    },
    "2030-02-24": {
      "sundayName": "Seventh Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 41 ( 4 )",
      "ot": "Isaiah 43:18-25",
      "epistle": "2 Corinthians 1:18-22",
      "gospel": "Mark 2:1-12",
      "source": "yaag.org"
    },
    "2030-03-03": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 50:1-6",
      "ot": "2 Kings 2:1-12",
      "epistle": "2 Corinthians 3:12-13 (14-18); 4:1-6",
      "gospel": "Mark 9:2-9",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-03-06": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-03-10": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 25:1-10",
      "ot": "Genesis 22:1-18",
      "epistle": "James 1:12-18",
      "gospel": "Mark 1:9-15",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-03-17": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 22:23-31",
      "ot": "Genesis 17:1-7, 15-16",
      "epistle": "Romans 5:1-11",
      "gospel": "Mark 8:27-38",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-03-24": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 19",
      "ot": "Exodus 20:1-17",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "John 2:13-22 (23-25)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-03-31": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 107:1-9",
      "ot": "Numbers 21:4-9",
      "epistle": "Ephesians 2:1-10",
      "gospel": "John 3:14-21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-04-07": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 5:1-10",
      "gospel": "Mark 10:(32-34) 35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-04-14": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Zechariah 9:9-12",
      "epistle": "Philippians 2:5-11",
      "gospel": "Mark 14:1-15:47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-04-18": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "1 Corinthians 10:16-17",
      "gospel": "Mark 14:12-26",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-04-19": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-04-21": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Isaiah 25:6-9",
      "epistle": "1 Corinthians 15:1-11",
      "gospel": "Mark 16:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 15:1-11",
          "epistle": "1 Corinthians 5:6b-8",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2030-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-04-28": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 148",
      "ot": "Acts 4:32-35",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-05-05": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 4",
      "ot": "Acts 3:11-21",
      "epistle": "1 John 3:1-7",
      "gospel": "Luke 24:36-49",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-05-12": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Acts 4:1-12",
      "epistle": "1 John 3:16-24",
      "gospel": "John 10:11-18",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-05-19": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 150",
      "ot": "Acts 8:26-40",
      "epistle": "1 John 4:1-11 (12-21)",
      "gospel": "John 15:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-05-26": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 98",
      "ot": "Acts 10:34-48",
      "epistle": "1 John 5:1-8",
      "gospel": "John 15:9-17",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-05-30": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-06-02": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 1",
      "ot": "Acts 1:12-26",
      "epistle": "1 John 5:9-15",
      "gospel": "John 17:11b-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-06-09": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 139:1-12 (13-16)",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Acts 2:1-21",
      "gospel": "John 15:26-27; 16:4b-15",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-06-16": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Isaiah 6:1-8",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 3:1-17",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-06-23": {
      "sundayName": "2nd Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 124",
      "ot": "Job 38:1-11",
      "epistle": "2 Corinthians 6:1-13",
      "gospel": "Mark 4:35-41",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-06-30": {
      "sundayName": "3rd Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 30",
      "ot": "Lamentations 3:22-33",
      "epistle": "2 Corinthians 8:1-9, 13-15",
      "gospel": "Mark 5:21-43",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-07-07": {
      "sundayName": "4th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 123",
      "ot": "Ezekiel 2:1-5",
      "epistle": "2 Corinthians 12:1-10",
      "gospel": "Mark 6:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-07-14": {
      "sundayName": "5th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 85:(1-7) 8-13",
      "ot": "Amos 7:7-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-07-21": {
      "sundayName": "6th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Jeremiah 23:1-6",
      "epistle": "Ephesians 2:11-22",
      "gospel": "Mark 6:30-44",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-07-28": {
      "sundayName": "7th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 136:1-9",
      "ot": "Genesis 9:8-17",
      "epistle": "Ephesians 3:14-21",
      "gospel": "Mark 6:45-56",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-08-04": {
      "sundayName": "8th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 145:10-21",
      "ot": "Exodus 16:2-15",
      "epistle": "Ephesians 4:1-16",
      "gospel": "John 6:22-35",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-08-11": {
      "sundayName": "9th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 34:1-8",
      "ot": "1 Kings 19:1-8",
      "epistle": "Ephesians 4:17-5:2",
      "gospel": "John 6:35-51",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-08-18": {
      "sundayName": "10th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 34:12-22",
      "ot": "Proverbs 9:1-10",
      "epistle": "Ephesians 5:6-21",
      "gospel": "John 6:51-69",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-08-25": {
      "sundayName": "11th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 14",
      "ot": "Isaiah 29:11-19",
      "epistle": "Ephesians 5:22-33",
      "gospel": "Mark 7:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-09-01": {
      "sundayName": "12th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 119:129-136",
      "ot": "Deuteronomy 4:1-2, 6-9",
      "epistle": "Ephesians 6:10-20",
      "gospel": "Mark 7:14-23",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-09-08": {
      "sundayName": "13th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:4-7a",
      "epistle": "James 2:1-10, 14-18",
      "gospel": "Mark 7:(24-30) 31-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-09-15": {
      "sundayName": "14th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 116:1-9",
      "ot": "Isaiah 50:4-10",
      "epistle": "James 3:1-12",
      "gospel": "Mark 9:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-09-22": {
      "sundayName": "15th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 11:18-20",
      "epistle": "James 3:13-4:10",
      "gospel": "Mark 9:30-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-09-29": {
      "sundayName": "16th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 104:27-35",
      "ot": "Numbers 11:4-6, 10-16, 24-29",
      "epistle": "James 5:(1-12) 13-20",
      "gospel": "Mark 9:38-50",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "St. Michael and All Angels",
          "psalm": "Psalm 91",
          "ot": "Daniel 10:10-14; 12:1-3",
          "epistle": "Revelation 12:7-12",
          "gospel": "Matthew 18:1-11"
        }
      ]
    },
    "2030-10-06": {
      "sundayName": "17th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 128",
      "ot": "Genesis 2:18-25",
      "epistle": "Hebrews 2:1-13 (14-18)",
      "gospel": "Mark 10:2-16",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-10-13": {
      "sundayName": "18th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 90:12-17",
      "ot": "Amos 5:6-7, 10-15",
      "epistle": "Hebrews 3:12-19",
      "gospel": "Mark 10:17-22",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2030-10-20": {
      "sundayName": "19th Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Ecclesiastes 5:10-20",
      "epistle": "Hebrews 4:1-13 (14-16)",
      "gospel": "Mark 10:23-31",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-10-27": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "20th Sunday after Pentecost (prop25)",
          "psalm": "Psalm 126",
          "ot": "Jeremiah 31:7-9",
          "epistle": "Hebrews 7:23-28",
          "gospel": "Mark 10:46-52"
        }
      ]
    },
    "2030-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-11-03": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "21st Sunday after Pentecost (prop26)",
          "psalm": "Psalm 119:1-8 ( 5 )",
          "ot": "Deuteronomy 6:1-9",
          "epistle": "Hebrews 9:11-14 ( 15-22 )",
          "gospel": "Mark 12:28-37"
        }
      ]
    },
    "2030-11-10": {
      "sundayName": "22nd Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "1 Kings 17:8-16",
      "epistle": "Hebrews 9:24-28",
      "gospel": "Mark 12:38-44",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-11-17": {
      "sundayName": "23rd Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Daniel 12:1-3",
      "epistle": "Hebrews 10:11-25",
      "gospel": "Mark 13:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-11-24": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 93",
      "ot": "Isaiah 51:4-6",
      "epistle": "Jude 20-25",
      "gospel": "Mark 13:24-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-11-28": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2030",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-12-01": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 25:1-10",
      "ot": "Jeremiah 33:14-16",
      "epistle": "1 Thessalonians 3:9-13",
      "gospel": "Luke 19:28-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-12-08": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 66:1-12",
      "ot": "Malachi 3:1-7b",
      "epistle": "Philippians 1:2-11",
      "gospel": "Luke 3:1-14 (15-20)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-12-15": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Zephaniah 3:14-20",
      "epistle": "Philippians 4:4-7",
      "gospel": "Luke 7:18-28 (29-35)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-12-22": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 80:1-7",
      "ot": "Micah 5:2-5a",
      "epistle": "Hebrews 10:5-10",
      "gospel": "Luke 1:39-45 (46-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2030-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2030-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2030-12-29": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Exodus 13:1-3a, 11-15",
      "epistle": "Colossians 3:12-17",
      "gospel": "Luke 2:22-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2030-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-01-05": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-01-12": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 29",
      "ot": "Isaiah 43:1-7",
      "epistle": "Romans 6:1-11",
      "gospel": "Luke 3:15-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-01-19": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 128",
      "ot": "Isaiah 62:1-5",
      "epistle": "1 Corinthians 12:1-11",
      "gospel": "John 2:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-01-26": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 19:(1-6) 7-14",
      "ot": "Nehemiah 8:1-3, 5-6, 8-10",
      "epistle": "1 Corinthians 12:12-31a",
      "gospel": "Luke 4:16-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "Fourth Sunday after the Epiphany",
          "psalm": "Psalm 71:1-6 ( 7-11 ) ( 12 )",
          "ot": "Jeremiah 1:4-10 ( 17-19 )",
          "epistle": "1 Corinthians 12:31b-13:13",
          "gospel": "Luke 4:31-44"
        }
      ]
    },
    "2031-02-09": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Isaiah 6:1-8 (9-13)",
      "epistle": "1 Corinthians 14:12b-20",
      "gospel": "Luke 5:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-02-16": {
      "sundayName": "Sixth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Jeremiah 17:5-8",
      "epistle": "1 Corinthians 15:(1-11) 12-20",
      "gospel": "Luke 6:17-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-02-23": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 99",
      "ot": "Deuteronomy 34:1-12",
      "epistle": "Hebrews 3:1-6",
      "gospel": "Luke 9:28-36",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-02-26": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:(1-6) 16-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-03-02": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 91:1-13",
      "ot": "Deuteronomy 26:1-11",
      "epistle": "Romans 10:8b-13",
      "gospel": "Luke 4:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-03-09": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 4",
      "ot": "Jeremiah 26:8-15",
      "epistle": "Philippians 3:17-4:1",
      "gospel": "Luke 13:31-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-03-16": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Ezekiel 33:7-20",
      "epistle": "1 Corinthians 10:1-13",
      "gospel": "Luke 13:1-9",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-03-23": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 32",
      "ot": "Isaiah 12:1-6",
      "epistle": "2 Corinthians 5:16-21",
      "gospel": "Luke 15:1-3, 11-32",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-03-30": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 126",
      "ot": "Isaiah 43:16-21",
      "epistle": "Philippians 3:(4b-7) 8-14",
      "gospel": "Luke 20:9-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-04-06": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Deuteronomy 32:36-39",
      "epistle": "Philippians 2:5-11",
      "gospel": "Luke 22:1-23:56",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-04-10": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 116:12-19",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 10:15-25",
      "gospel": "Luke 22:7-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-04-11": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-04-13": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "Isaiah 65:17-25",
      "epistle": "1 Corinthians 15:19-26",
      "gospel": "Luke 24:1-12",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Job 19:23-27",
          "epistle": "1 Corinthians 15:51-57",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2031-04-20": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 5:12-20 (21-32)",
      "epistle": "Revelation 1:4-18",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-04-27": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 30",
      "ot": "Acts 9:1-22",
      "epistle": "Revelation 5:(1-7) 8-14",
      "gospel": "John 21:1-14 (15-19)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-05-04": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 23",
      "ot": "Acts 20:17-35",
      "epistle": "Revelation 7:9-17",
      "gospel": "John 10:22-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-05-11": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 11:1-18",
      "epistle": "Revelation 21:1-7",
      "gospel": "John 16:12-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-05-18": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 16:9-15",
      "epistle": "Revelation 21:9-14, 21-27",
      "gospel": "John 16:23-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-05-22": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-05-25": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 133",
      "ot": "Acts 1:12-26",
      "epistle": "Revelation 22:1-6 (7-11) 12-20",
      "gospel": "John 17:20-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-06-01": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 143",
      "ot": "Genesis 11:1-9",
      "epistle": "Acts 2:1-21",
      "gospel": "John 14:23-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-06-08": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Proverbs 8:1-4, 22-31",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 8:48-59",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-06-15": {
      "sundayName": "2nd Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 32:1-7 ( 2 )",
      "ot": "2 Samuel 11:26-12:10, 13-14",
      "epistle": "Galatians 2:15-21; 3:10-14",
      "gospel": "Luke 7:36-8:3",
      "source": "yaag.org"
    },
    "2031-06-22": {
      "sundayName": "3rd Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 3",
      "ot": "Isaiah 65:1-9",
      "epistle": "Galatians 3:23-4:7",
      "gospel": "Luke 8:26-39",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-06-29": {
      "sundayName": "4th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "1 Kings 19:9b-21",
      "epistle": "Galatians 5:1, 13-25",
      "gospel": "Luke 9:51-62",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "St. Peter and St. Paul, Apostles",
          "psalm": "Psalm 46",
          "ot": "Acts 15:1-12 (13-21)",
          "epistle": "Galatians 2:1-10",
          "gospel": "Matthew 16:13-19"
        }
      ]
    },
    "2031-07-06": {
      "sundayName": "5th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 66:1-7",
      "ot": "Isaiah 66:10-14",
      "epistle": "Galatians 6:1-10, 14-18",
      "gospel": "Luke 10:1-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-07-13": {
      "sundayName": "6th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 41",
      "ot": "Leviticus (18:1-5) 19:9-18",
      "epistle": "Colossians 1:1-14",
      "gospel": "Luke 10:25-37",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-07-20": {
      "sundayName": "7th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 27:(1-6) 7-14",
      "ot": "Genesis 18:1-10a (10b-14)",
      "epistle": "Colossians 1:21-29",
      "gospel": "Luke 10:38-42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-07-27": {
      "sundayName": "8th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Genesis 18:(17-19) 20-33",
      "epistle": "Colossians 2:6-15 (16-19)",
      "gospel": "Luke 11:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-08-03": {
      "sundayName": "9th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 100",
      "ot": "Ecclesiastes 1:2, 12-14; 2:18-26",
      "epistle": "Colossians 3:1-11",
      "gospel": "Luke 12:13-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-08-10": {
      "sundayName": "10th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 33:12-22",
      "ot": "Genesis 15:1-6",
      "epistle": "Hebrews 11:1-16",
      "gospel": "Luke 12:22-34 (35-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-08-17": {
      "sundayName": "11th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 119:81-88",
      "ot": "Jeremiah 23:16-29",
      "epistle": "Hebrews 11:17-31 (32-40); 12:1-3",
      "gospel": "Luke 12:49-53 (54-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-08-24": {
      "sundayName": "12th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 50:1-15",
      "ot": "Isaiah 66:18-23",
      "epistle": "Hebrews 12:4-24 (25-29)",
      "gospel": "Luke 13:22-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "St. Bartholomew, Apostle",
          "psalm": "Psalm 121",
          "ot": "Proverbs 3:1-8",
          "epistle": "2 Corinthians 4:7-10",
          "gospel": "Luke 22:24-30"
        }
      ]
    },
    "2031-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-08-31": {
      "sundayName": "13th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 131",
      "ot": "Proverbs 25:2-10",
      "epistle": "Hebrews 13:1-17",
      "gospel": "Luke 14:1-14",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-09-07": {
      "sundayName": "14th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Deuteronomy 30:15-20",
      "epistle": "Philemon 1-21",
      "gospel": "Luke 14:25-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-09-14": {
      "sundayName": "15th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 119:169-176",
      "ot": "Ezekiel 34:11-24",
      "epistle": "1 Timothy 1:(5-11) 12-17",
      "gospel": "Luke 15:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "Holy Cross Day",
          "psalm": "Psalm 40:1-11",
          "ot": "Numbers 21:4-9",
          "epistle": "1 Corinthians 1:18-25",
          "gospel": "John 12:20-33"
        }
      ]
    },
    "2031-09-21": {
      "sundayName": "16th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 113",
      "ot": "Amos 8:4-7",
      "epistle": "1 Timothy 2:1-15",
      "gospel": "Luke 16:1-15",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "St. Matthew, Apostle and Evangelist",
          "psalm": "Psalm 119:33-40",
          "ot": "Ezekiel 2:8-3:11",
          "epistle": "Ephesians 4:7-16",
          "gospel": "Matthew 9:9-13"
        }
      ]
    },
    "2031-09-28": {
      "sundayName": "17th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Amos 6:1-7",
      "epistle": "1 Timothy 3:1-13",
      "gospel": "Luke 16:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-10-05": {
      "sundayName": "18th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 62",
      "ot": "Habakkuk 1:1-4; 2:1-4",
      "epistle": "2 Timothy 1:1-14",
      "gospel": "Luke 17:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-10-12": {
      "sundayName": "19th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Ruth 1:1-19a",
      "epistle": "2 Timothy 2:1-13",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-10-19": {
      "sundayName": "20th Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Genesis 32:22-30",
      "epistle": "2 Timothy 3:14-4:5",
      "gospel": "Luke 18:1-8",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-10-26": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "21st Sunday after Pentecost (prop25)",
          "psalm": "Psalm 5",
          "ot": "Genesis 4:1-15",
          "epistle": "2 Timothy 4:6-8, 16-18",
          "gospel": "Luke 18:9-17"
        }
      ]
    },
    "2031-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-11-02": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop26)",
          "psalm": "Psalm 130",
          "ot": "Isaiah 1:10-18",
          "epistle": "2 Thessalonians 1:1-5 (6-10) 11-12",
          "gospel": "Luke 19:1-10"
        }
      ]
    },
    "2031-11-09": {
      "sundayName": "23rd Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Exodus 3:1-15",
      "epistle": "2 Thessalonians 2:1-8, 13-17",
      "gospel": "Luke 20:27-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-11-16": {
      "sundayName": "24th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 98",
      "ot": "Malachi 4:1-6",
      "epistle": "2 Thessalonians 3:(1-5) 6-13",
      "gospel": "Luke 21:5-28 (29-36)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-11-23": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Malachi 3:13-18",
      "epistle": "Colossians 1:13-20",
      "gospel": "Luke 23:27-43",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2031-11-27": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2031",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-11-30": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 122",
      "ot": "Isaiah 2:1-5",
      "epistle": "Romans 13:(8-10) 11-14",
      "gospel": "Matthew 21:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-12-07": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 72:1-7",
      "ot": "Isaiah 11:1-10",
      "epistle": "Romans 15:4-13",
      "gospel": "Matthew 3:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-12-14": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:1-10",
      "epistle": "James 5:7-11",
      "gospel": "Matthew 11:2-15",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-12-21": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 24",
      "ot": "Isaiah 7:10-17",
      "epistle": "Romans 1:1-7",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2031-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2031-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2031-12-28": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 111",
      "ot": "Isaiah 63:7-14",
      "epistle": "Galatians 4:4-7",
      "gospel": "Matthew 2:13-23",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Holy Innocents, Martyrs",
          "psalm": "Psalm 54",
          "ot": "Jeremiah 31:15-17",
          "epistle": "Revelation 14:1-5",
          "gospel": "Matthew 2:13-18"
        }
      ]
    },
    "2031-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-01-04": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-01-11": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 29",
      "ot": "Isaiah 42:1-9",
      "epistle": "Romans 6:1-11",
      "gospel": "Matthew 3:13-17",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-01-18": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Isaiah 49:1-7",
      "epistle": "1 Corinthians 1:1-9",
      "gospel": "John 1:29-42a",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Confession of St. Peter",
          "psalm": "Psalm 118:19-29",
          "ot": "Acts 4:8-13",
          "epistle": "2 Peter 1:1-15",
          "gospel": "Mark 8:27-35 (36-9:1)"
        }
      ]
    },
    "2032-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-01-25": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 27:1-9 (10-14)",
      "ot": "Isaiah 9:1-4",
      "epistle": "1 Corinthians 1:10-18",
      "gospel": "Matthew 4:12-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Conversion of St. Paul",
          "psalm": "Psalm 67",
          "ot": "Acts 9:1-22",
          "epistle": "Galatians 1:11-24",
          "gospel": "Matthew 19:27-30"
        }
      ]
    },
    "2032-02-01": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 15",
      "ot": "Micah 6:1-8",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2032-02-08": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 2:6-12",
      "ot": "Exodus 24:8-18",
      "epistle": "2 Peter 1:16-21",
      "gospel": "Matthew 17:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-02-11": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-02-15": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Genesis 3:1-21",
      "epistle": "Romans 5:12-19",
      "gospel": "Matthew 4:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-02-22": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Genesis 12:1-9",
      "epistle": "Romans 4:1-8, 13-17",
      "gospel": "John 3:1-17",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-02-29": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 95:1-9",
      "ot": "Exodus 17:1-7",
      "epistle": "Romans 5:1-8",
      "gospel": "John 4:5-26 (27-30, 39-42)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-03-07": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 142",
      "ot": "Isaiah 42:14-21",
      "epistle": "Ephesians 5:8-14",
      "gospel": "John 9:1-41",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-03-14": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 130",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Romans 8:1-11",
      "gospel": "John 11:1-45 (46-53)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-03-21": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 118:19-29",
      "ot": "Isaiah 50:4-9a",
      "epistle": "Philippians 2:5-11",
      "gospel": "Matthew 26:1-27:66",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-03-25": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "Hebrews 9:11-22",
      "gospel": "Matthew 26:17-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-03-26": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-03-28": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 16",
      "ot": "Acts 10:34-43",
      "epistle": "Colossians 3:1-4",
      "gospel": "Matthew 28:1-10",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 14:10-15:1",
          "epistle": "1 Corinthians 15:1-11",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2032-04-04": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 148",
      "ot": "Acts 5:29-42",
      "epistle": "1 Peter 1:3-9",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-04-11": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 116:1-14",
      "ot": "Acts 2:14a, 36-41",
      "epistle": "1 Peter 1:17-25",
      "gospel": "Luke 24:13-35",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-04-18": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Acts 2:42-47",
      "epistle": "1 Peter 2:19-25",
      "gospel": "John 10:1-10",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-04-25": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Acts 6:1-9; 7:2a, 51-60",
      "epistle": "1 Peter 2:2-10",
      "gospel": "John 14:1-14",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "St. Mark, Evangelist",
          "psalm": "Psalm 146",
          "ot": "Isaiah 52:7-10",
          "epistle": "2 Timothy 4:5-18",
          "gospel": "Mark 16:14-20"
        }
      ]
    },
    "2032-05-02": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 66:8-20",
      "ot": "Acts 17:16-31",
      "epistle": "1 Peter 3:13-22",
      "gospel": "John 14:15-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-05-06": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-05-09": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 68:1-10",
      "ot": "Acts 1:12-26",
      "epistle": "1 Peter 4:12-19; 5:6-11",
      "gospel": "John 17:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-05-16": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 25:1-15",
      "ot": "Numbers 11:24-30",
      "epistle": "Acts 2:1-21",
      "gospel": "John 7:37-39",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-05-23": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Genesis 1:1-2:4a",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "Matthew 28:16-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-05-30": {
      "sundayName": "2nd Sunday after Pentecost (prop4)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 4",
      "ot": "Deuteronomy 11:18-21, 26-28",
      "epistle": "Romans 3:21-28",
      "gospel": "Matthew 7:15-29",
      "source": "yaag.org"
    },
    "2032-06-06": {
      "sundayName": "3rd Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 119:65-72",
      "ot": "Hosea 5:15-6:6",
      "epistle": "Romans 4:13-25",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-06-13": {
      "sundayName": "4th Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 100",
      "ot": "Exodus 19:2-8",
      "epistle": "Romans 5:6-15",
      "gospel": "Matthew 9:35-10:8 (9-20)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-06-20": {
      "sundayName": "5th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 91:1-10 (11-16)",
      "ot": "Jeremiah 20:7-13",
      "epistle": "Romans 6:12-23",
      "gospel": "Matthew 10:5a, 21-33",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-06-27": {
      "sundayName": "6th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 119:153-160",
      "ot": "Jeremiah 28:5-9",
      "epistle": "Romans 7:1-13",
      "gospel": "Matthew 10:34-42",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2032-07-04": {
      "sundayName": "7th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 145:1-14",
      "ot": "Zechariah 9:9-12",
      "epistle": "Romans 7:14-25a",
      "gospel": "Matthew 11:25-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-07-11": {
      "sundayName": "8th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 65:(1-8) 9-13",
      "ot": "Isaiah 55:10-13",
      "epistle": "Romans 8:12-17",
      "gospel": "Matthew 13:1-9, 18-23",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-07-18": {
      "sundayName": "9th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 119:57-64",
      "ot": "Isaiah 44:6-8",
      "epistle": "Romans 8:18-27",
      "gospel": "Matthew 13:24-30, 36-43",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-07-25": {
      "sundayName": "10th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 125",
      "ot": "Deuteronomy 7:6-9",
      "epistle": "Romans 8:28-39",
      "gospel": "Matthew 13:44-52",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "St. James the Elder, Apostle",
          "psalm": "Psalm 56",
          "ot": "Acts 11:27-12:5",
          "epistle": "Romans 8:28-39",
          "gospel": "Mark 10:35-45"
        }
      ]
    },
    "2032-08-01": {
      "sundayName": "11th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 136:1-9 (23-26)",
      "ot": "Isaiah 55:1-5",
      "epistle": "Romans 9:1-5 (6-13)",
      "gospel": "Matthew 14:13-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-08-08": {
      "sundayName": "12th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 18:1-6 (7-16)",
      "ot": "Job 38:4-18",
      "epistle": "Romans 10:5-17",
      "gospel": "Matthew 14:22-33",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-08-15": {
      "sundayName": "13th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Isaiah 56:1, 6-8",
      "epistle": "Romans 11:1-2a, 13-15, 28-32",
      "gospel": "Matthew 15:21-28",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "St. Mary, Mother of Our Lord",
          "psalm": "Psalm 45:10-17",
          "ot": "Isaiah 61:7-11",
          "epistle": "Galatians 4:4-7",
          "gospel": "Luke 1:(39-45) 46-55"
        }
      ]
    },
    "2032-08-22": {
      "sundayName": "14th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 138",
      "ot": "Isaiah 51:1-6",
      "epistle": "Romans 11:33-12:8",
      "gospel": "Matthew 16:13-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2032-08-29": {
      "sundayName": "15th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 26",
      "ot": "Jeremiah 15:15-21",
      "epistle": "Romans 12:9-21",
      "gospel": "Matthew 16:21-28",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Martyrdom of St. John the Baptist",
          "psalm": "Psalm 71:1-8",
          "ot": "Revelation 6:9-11",
          "epistle": "Romans 6:1-5",
          "gospel": "Mark 6:14-29"
        }
      ]
    },
    "2032-09-05": {
      "sundayName": "16th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Ezekiel 33:7-9",
      "epistle": "Romans 13:1-10",
      "gospel": "Matthew 18:1-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-09-12": {
      "sundayName": "17th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 103:1-12",
      "ot": "Genesis 50:15-21",
      "epistle": "Romans 14:1-12",
      "gospel": "Matthew 18:21-35",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2032-09-19": {
      "sundayName": "18th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 27:1-9",
      "ot": "Isaiah 55:6-9",
      "epistle": "Philippians 1:12-14, 19-30",
      "gospel": "Matthew 20:1-16",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2032-09-26": {
      "sundayName": "19th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 25:1-10",
      "ot": "Ezekiel 18:1-4, 25-32",
      "epistle": "Philippians 2:1-4 (5-13) 14-18",
      "gospel": "Matthew 21:23-27 (28-32)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-10-03": {
      "sundayName": "20th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 80:7-19",
      "ot": "Isaiah 5:1-7",
      "epistle": "Philippians 3:4b-14",
      "gospel": "Matthew 21:33-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-10-10": {
      "sundayName": "21st Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Isaiah 25:6-9",
      "epistle": "Philippians 4:4-13",
      "gospel": "Matthew 22:1-14",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-10-17": {
      "sundayName": "22nd Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 96:1-9 (10-13)",
      "ot": "Isaiah 45:1-7",
      "epistle": "1 Thessalonians 1:1-10",
      "gospel": "Matthew 22:15-22",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-10-24": {
      "sundayName": "23rd Sunday after Pentecost (prop25)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 1",
      "ot": "Leviticus 19:1-2, 15-18",
      "epistle": "1 Thessalonians 2:1-13",
      "gospel": "Matthew 22:34-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "24th Sunday after Pentecost (prop26)",
          "psalm": "Psalm 43 ( 3 )",
          "ot": "Micah 3:5-12",
          "epistle": "1 Thessalonians 4:1-12",
          "gospel": "Matthew 23:1-12"
        }
      ]
    },
    "2032-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-11-07": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "25th Sunday after Pentecost (prop27)",
          "psalm": "Psalm 70",
          "ot": "Amos 5:18-24",
          "epistle": "1 Thessalonians 4:13-18",
          "gospel": "Matthew 25:1-13"
        }
      ]
    },
    "2032-11-14": {
      "sundayName": "26th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Zephaniah 1:7-16",
      "epistle": "1 Thessalonians 5:1-11",
      "gospel": "Matthew 25:14-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-11-21": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 95:1-7a",
      "ot": "Ezekiel 34:11-16, 20-24",
      "epistle": "1 Corinthians 15:20-28",
      "gospel": "Matthew 25:31-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-11-25": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2032",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-11-28": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 80:1-7",
      "ot": "Isaiah 64:1-9",
      "epistle": "1 Corinthians 1:3-9",
      "gospel": "Mark 11:1-10",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-05": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 85",
      "ot": "Isaiah 40:1-11",
      "epistle": "2 Peter 3:8-14",
      "gospel": "Mark 1:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-12": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 126",
      "ot": "Isaiah 61:1-4, 8-11",
      "epistle": "1 Thessalonians 5:16-24",
      "gospel": "John 1:6-8, 19-28",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-19": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 89:1-5 (19-29)",
      "ot": "2 Samuel 7:1-11, 16",
      "epistle": "Romans 16:25-27",
      "gospel": "Luke 1:26-38",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2032-12-26": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Isaiah 61:10-62:3",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 2:22-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2032-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2032-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-02": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-09": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Genesis 1:1-5",
      "epistle": "Romans 6:1-11",
      "gospel": "Mark 1:4-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-16": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 139:1-10",
      "ot": "1 Samuel 3:1-10 (11-20)",
      "epistle": "1 Corinthians 6:12-20",
      "gospel": "John 1:43-51",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2033-01-23": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 62",
      "ot": "Jonah 3:1-5, 10",
      "epistle": "1 Corinthians 7:29-31 (32-35)",
      "gospel": "Mark 1:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2033-01-30": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Deuteronomy 18:15-20",
      "epistle": "1 Corinthians 8:1-13",
      "gospel": "Mark 1:21-28",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-02-06": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 147:1-11 ( 5 )",
      "ot": "Isaiah 40:21-31",
      "epistle": "1 Corinthians 9:16-27",
      "gospel": "Mark 1:29-39",
      "source": "yaag.org"
    },
    "2033-02-13": {
      "sundayName": "Sixth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 30 ( 2 )",
      "ot": "2 Kings 5:1-14",
      "epistle": "1 Corinthians 10:( 19-30 ) 31-11:1",
      "gospel": "Mark 1:40-45",
      "source": "yaag.org"
    },
    "2033-02-20": {
      "sundayName": "Seventh Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 41 ( 4 )",
      "ot": "Isaiah 43:18-25",
      "epistle": "2 Corinthians 1:18-22",
      "gospel": "Mark 2:1-12",
      "source": "yaag.org"
    },
    "2033-02-27": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 50:1-6",
      "ot": "2 Kings 2:1-12",
      "epistle": "2 Corinthians 3:12-13 (14-18); 4:1-6",
      "gospel": "Mark 9:2-9",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-03-02": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-03-06": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 25:1-10",
      "ot": "Genesis 22:1-18",
      "epistle": "James 1:12-18",
      "gospel": "Mark 1:9-15",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-03-13": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 22:23-31",
      "ot": "Genesis 17:1-7, 15-16",
      "epistle": "Romans 5:1-11",
      "gospel": "Mark 8:27-38",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-03-20": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 19",
      "ot": "Exodus 20:1-17",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "John 2:13-22 (23-25)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-03-27": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 107:1-9",
      "ot": "Numbers 21:4-9",
      "epistle": "Ephesians 2:1-10",
      "gospel": "John 3:14-21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-04-03": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 5:1-10",
      "gospel": "Mark 10:(32-34) 35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-04-10": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Zechariah 9:9-12",
      "epistle": "Philippians 2:5-11",
      "gospel": "Mark 14:1-15:47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-04-14": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "1 Corinthians 10:16-17",
      "gospel": "Mark 14:12-26",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-04-15": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-04-17": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Isaiah 25:6-9",
      "epistle": "1 Corinthians 15:1-11",
      "gospel": "Mark 16:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 15:1-11",
          "epistle": "1 Corinthians 5:6b-8",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2033-04-24": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 148",
      "ot": "Acts 4:32-35",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-05-01": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 4",
      "ot": "Acts 3:11-21",
      "epistle": "1 John 3:1-7",
      "gospel": "Luke 24:36-49",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-05-08": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Acts 4:1-12",
      "epistle": "1 John 3:16-24",
      "gospel": "John 10:11-18",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-05-15": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 150",
      "ot": "Acts 8:26-40",
      "epistle": "1 John 4:1-11 (12-21)",
      "gospel": "John 15:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-05-22": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 98",
      "ot": "Acts 10:34-48",
      "epistle": "1 John 5:1-8",
      "gospel": "John 15:9-17",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-05-26": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-05-29": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 1",
      "ot": "Acts 1:12-26",
      "epistle": "1 John 5:9-15",
      "gospel": "John 17:11b-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-06-05": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 139:1-12 (13-16)",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Acts 2:1-21",
      "gospel": "John 15:26-27; 16:4b-15",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-06-12": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Isaiah 6:1-8",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 3:1-17",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-06-19": {
      "sundayName": "2nd Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 124",
      "ot": "Job 38:1-11",
      "epistle": "2 Corinthians 6:1-13",
      "gospel": "Mark 4:35-41",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-06-26": {
      "sundayName": "3rd Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 30",
      "ot": "Lamentations 3:22-33",
      "epistle": "2 Corinthians 8:1-9, 13-15",
      "gospel": "Mark 5:21-43",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-07-03": {
      "sundayName": "4th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 123",
      "ot": "Ezekiel 2:1-5",
      "epistle": "2 Corinthians 12:1-10",
      "gospel": "Mark 6:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-07-10": {
      "sundayName": "5th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 85:(1-7) 8-13",
      "ot": "Amos 7:7-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-07-17": {
      "sundayName": "6th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Jeremiah 23:1-6",
      "epistle": "Ephesians 2:11-22",
      "gospel": "Mark 6:30-44",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-07-24": {
      "sundayName": "7th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 136:1-9",
      "ot": "Genesis 9:8-17",
      "epistle": "Ephesians 3:14-21",
      "gospel": "Mark 6:45-56",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-07-31": {
      "sundayName": "8th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 145:10-21",
      "ot": "Exodus 16:2-15",
      "epistle": "Ephesians 4:1-16",
      "gospel": "John 6:22-35",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-08-07": {
      "sundayName": "9th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 34:1-8",
      "ot": "1 Kings 19:1-8",
      "epistle": "Ephesians 4:17-5:2",
      "gospel": "John 6:35-51",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-08-14": {
      "sundayName": "10th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 34:12-22",
      "ot": "Proverbs 9:1-10",
      "epistle": "Ephesians 5:6-21",
      "gospel": "John 6:51-69",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-08-21": {
      "sundayName": "11th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 14",
      "ot": "Isaiah 29:11-19",
      "epistle": "Ephesians 5:22-33",
      "gospel": "Mark 7:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-08-28": {
      "sundayName": "12th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 119:129-136",
      "ot": "Deuteronomy 4:1-2, 6-9",
      "epistle": "Ephesians 6:10-20",
      "gospel": "Mark 7:14-23",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-09-04": {
      "sundayName": "13th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:4-7a",
      "epistle": "James 2:1-10, 14-18",
      "gospel": "Mark 7:(24-30) 31-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-09-11": {
      "sundayName": "14th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 116:1-9",
      "ot": "Isaiah 50:4-10",
      "epistle": "James 3:1-12",
      "gospel": "Mark 9:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-09-18": {
      "sundayName": "15th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 11:18-20",
      "epistle": "James 3:13-4:10",
      "gospel": "Mark 9:30-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-09-25": {
      "sundayName": "16th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 104:27-35",
      "ot": "Numbers 11:4-6, 10-16, 24-29",
      "epistle": "James 5:(1-12) 13-20",
      "gospel": "Mark 9:38-50",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-10-02": {
      "sundayName": "17th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 128",
      "ot": "Genesis 2:18-25",
      "epistle": "Hebrews 2:1-13 (14-18)",
      "gospel": "Mark 10:2-16",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-10-09": {
      "sundayName": "18th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 90:12-17",
      "ot": "Amos 5:6-7, 10-15",
      "epistle": "Hebrews 3:12-19",
      "gospel": "Mark 10:17-22",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-10-16": {
      "sundayName": "19th Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Ecclesiastes 5:10-20",
      "epistle": "Hebrews 4:1-13 (14-16)",
      "gospel": "Mark 10:23-31",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2033-10-23": {
      "sundayName": "20th Sunday after Pentecost (prop25)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 126",
      "ot": "Jeremiah 31:7-9",
      "epistle": "Hebrews 7:23-28",
      "gospel": "Mark 10:46-52",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-10-30": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "21st Sunday after Pentecost (prop26)",
          "psalm": "Psalm 119:1-8 ( 5 )",
          "ot": "Deuteronomy 6:1-9",
          "epistle": "Hebrews 9:11-14 ( 15-22 )",
          "gospel": "Mark 12:28-37"
        }
      ]
    },
    "2033-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-11-06": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop27)",
          "psalm": "Psalm 146",
          "ot": "1 Kings 17:8-16",
          "epistle": "Hebrews 9:24-28",
          "gospel": "Mark 12:38-44"
        }
      ]
    },
    "2033-11-13": {
      "sundayName": "23rd Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Daniel 12:1-3",
      "epistle": "Hebrews 10:11-25",
      "gospel": "Mark 13:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-11-20": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 93",
      "ot": "Isaiah 51:4-6",
      "epistle": "Jude 20-25",
      "gospel": "Mark 13:24-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-11-24": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2033",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-11-27": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 25:1-10",
      "ot": "Jeremiah 33:14-16",
      "epistle": "1 Thessalonians 3:9-13",
      "gospel": "Luke 19:28-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-12-04": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 66:1-12",
      "ot": "Malachi 3:1-7b",
      "epistle": "Philippians 1:2-11",
      "gospel": "Luke 3:1-14 (15-20)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-12-11": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Zephaniah 3:14-20",
      "epistle": "Philippians 4:4-7",
      "gospel": "Luke 7:18-28 (29-35)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-12-18": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 80:1-7",
      "ot": "Micah 5:2-5a",
      "epistle": "Hebrews 10:5-10",
      "gospel": "Luke 1:39-45 (46-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2033-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2033-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2033-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2033-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "First Sunday after Christmas",
          "psalm": "Psalm 111",
          "ot": "Exodus 13:1-3a, 11-15",
          "epistle": "Colossians 3:12-17",
          "gospel": "Luke 2:22-40"
        }
      ]
    },
    "2034-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-01-08": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 29",
      "ot": "Isaiah 43:1-7",
      "epistle": "Romans 6:1-11",
      "gospel": "Luke 3:15-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-01-15": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 128",
      "ot": "Isaiah 62:1-5",
      "epistle": "1 Corinthians 12:1-11",
      "gospel": "John 2:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-01-22": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 19:(1-6) 7-14",
      "ot": "Nehemiah 8:1-3, 5-6, 8-10",
      "epistle": "1 Corinthians 12:12-31a",
      "gospel": "Luke 4:16-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-01-29": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 71:1-6 ( 7-11 ) ( 12 )",
      "ot": "Jeremiah 1:4-10 ( 17-19 )",
      "epistle": "1 Corinthians 12:31b-13:13",
      "gospel": "Luke 4:31-44",
      "source": "yaag.org"
    },
    "2034-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-02-05": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Isaiah 6:1-8 (9-13)",
      "epistle": "1 Corinthians 14:12b-20",
      "gospel": "Luke 5:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-02-12": {
      "sundayName": "Sixth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Jeremiah 17:5-8",
      "epistle": "1 Corinthians 15:(1-11) 12-20",
      "gospel": "Luke 6:17-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-02-19": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 99",
      "ot": "Deuteronomy 34:1-12",
      "epistle": "Hebrews 3:1-6",
      "gospel": "Luke 9:28-36",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-02-22": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:(1-6) 16-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-02-26": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 91:1-13",
      "ot": "Deuteronomy 26:1-11",
      "epistle": "Romans 10:8b-13",
      "gospel": "Luke 4:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-03-05": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 4",
      "ot": "Jeremiah 26:8-15",
      "epistle": "Philippians 3:17-4:1",
      "gospel": "Luke 13:31-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-03-12": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Ezekiel 33:7-20",
      "epistle": "1 Corinthians 10:1-13",
      "gospel": "Luke 13:1-9",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-03-19": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 32",
      "ot": "Isaiah 12:1-6",
      "epistle": "2 Corinthians 5:16-21",
      "gospel": "Luke 15:1-3, 11-32",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-03-26": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 126",
      "ot": "Isaiah 43:16-21",
      "epistle": "Philippians 3:(4b-7) 8-14",
      "gospel": "Luke 20:9-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-04-02": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Deuteronomy 32:36-39",
      "epistle": "Philippians 2:5-11",
      "gospel": "Luke 22:1-23:56",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-04-06": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 116:12-19",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 10:15-25",
      "gospel": "Luke 22:7-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-04-07": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-04-09": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "Isaiah 65:17-25",
      "epistle": "1 Corinthians 15:19-26",
      "gospel": "Luke 24:1-12",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Job 19:23-27",
          "epistle": "1 Corinthians 15:51-57",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2034-04-16": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 5:12-20 (21-32)",
      "epistle": "Revelation 1:4-18",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-04-23": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 30",
      "ot": "Acts 9:1-22",
      "epistle": "Revelation 5:(1-7) 8-14",
      "gospel": "John 21:1-14 (15-19)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-04-30": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 23",
      "ot": "Acts 20:17-35",
      "epistle": "Revelation 7:9-17",
      "gospel": "John 10:22-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-05-07": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 11:1-18",
      "epistle": "Revelation 21:1-7",
      "gospel": "John 16:12-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-05-14": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 16:9-15",
      "epistle": "Revelation 21:9-14, 21-27",
      "gospel": "John 16:23-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-05-18": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-05-21": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 133",
      "ot": "Acts 1:12-26",
      "epistle": "Revelation 22:1-6 (7-11) 12-20",
      "gospel": "John 17:20-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-05-28": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 143",
      "ot": "Genesis 11:1-9",
      "epistle": "Acts 2:1-21",
      "gospel": "John 14:23-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-06-04": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Proverbs 8:1-4, 22-31",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 8:48-59",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-06-11": {
      "sundayName": "2nd Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 30 ( 5b )",
      "ot": "1 Kings 17:17-24",
      "epistle": "Galatians 1:11-24",
      "gospel": "Luke 7:11-17",
      "source": "yaag.org"
    },
    "2034-06-18": {
      "sundayName": "3rd Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 32:1-7 ( 2 )",
      "ot": "2 Samuel 11:26-12:10, 13-14",
      "epistle": "Galatians 2:15-21; 3:10-14",
      "gospel": "Luke 7:36-8:3",
      "source": "yaag.org"
    },
    "2034-06-25": {
      "sundayName": "4th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 3",
      "ot": "Isaiah 65:1-9",
      "epistle": "Galatians 3:23-4:7",
      "gospel": "Luke 8:26-39",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-07-02": {
      "sundayName": "5th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "1 Kings 19:9b-21",
      "epistle": "Galatians 5:1, 13-25",
      "gospel": "Luke 9:51-62",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-07-09": {
      "sundayName": "6th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 66:1-7",
      "ot": "Isaiah 66:10-14",
      "epistle": "Galatians 6:1-10, 14-18",
      "gospel": "Luke 10:1-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-07-16": {
      "sundayName": "7th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 41",
      "ot": "Leviticus (18:1-5) 19:9-18",
      "epistle": "Colossians 1:1-14",
      "gospel": "Luke 10:25-37",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-07-23": {
      "sundayName": "8th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 27:(1-6) 7-14",
      "ot": "Genesis 18:1-10a (10b-14)",
      "epistle": "Colossians 1:21-29",
      "gospel": "Luke 10:38-42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-07-30": {
      "sundayName": "9th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Genesis 18:(17-19) 20-33",
      "epistle": "Colossians 2:6-15 (16-19)",
      "gospel": "Luke 11:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-08-06": {
      "sundayName": "10th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 100",
      "ot": "Ecclesiastes 1:2, 12-14; 2:18-26",
      "epistle": "Colossians 3:1-11",
      "gospel": "Luke 12:13-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-08-13": {
      "sundayName": "11th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 33:12-22",
      "ot": "Genesis 15:1-6",
      "epistle": "Hebrews 11:1-16",
      "gospel": "Luke 12:22-34 (35-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-08-20": {
      "sundayName": "12th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 119:81-88",
      "ot": "Jeremiah 23:16-29",
      "epistle": "Hebrews 11:17-31 (32-40); 12:1-3",
      "gospel": "Luke 12:49-53 (54-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-08-27": {
      "sundayName": "13th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 50:1-15",
      "ot": "Isaiah 66:18-23",
      "epistle": "Hebrews 12:4-24 (25-29)",
      "gospel": "Luke 13:22-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-09-03": {
      "sundayName": "14th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 131",
      "ot": "Proverbs 25:2-10",
      "epistle": "Hebrews 13:1-17",
      "gospel": "Luke 14:1-14",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-09-10": {
      "sundayName": "15th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Deuteronomy 30:15-20",
      "epistle": "Philemon 1-21",
      "gospel": "Luke 14:25-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-09-17": {
      "sundayName": "16th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 119:169-176",
      "ot": "Ezekiel 34:11-24",
      "epistle": "1 Timothy 1:(5-11) 12-17",
      "gospel": "Luke 15:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-09-24": {
      "sundayName": "17th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 113",
      "ot": "Amos 8:4-7",
      "epistle": "1 Timothy 2:1-15",
      "gospel": "Luke 16:1-15",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-10-01": {
      "sundayName": "18th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Amos 6:1-7",
      "epistle": "1 Timothy 3:1-13",
      "gospel": "Luke 16:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-10-08": {
      "sundayName": "19th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 62",
      "ot": "Habakkuk 1:1-4; 2:1-4",
      "epistle": "2 Timothy 1:1-14",
      "gospel": "Luke 17:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-10-15": {
      "sundayName": "20th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Ruth 1:1-19a",
      "epistle": "2 Timothy 2:1-13",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-10-22": {
      "sundayName": "21st Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Genesis 32:22-30",
      "epistle": "2 Timothy 3:14-4:5",
      "gospel": "Luke 18:1-8",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-10-29": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop25)",
          "psalm": "Psalm 5",
          "ot": "Genesis 4:1-15",
          "epistle": "2 Timothy 4:6-8, 16-18",
          "gospel": "Luke 18:9-17"
        }
      ]
    },
    "2034-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-11-05": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "23rd Sunday after Pentecost (prop26)",
          "psalm": "Psalm 130",
          "ot": "Isaiah 1:10-18",
          "epistle": "2 Thessalonians 1:1-5 (6-10) 11-12",
          "gospel": "Luke 19:1-10"
        }
      ]
    },
    "2034-11-12": {
      "sundayName": "24th Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Exodus 3:1-15",
      "epistle": "2 Thessalonians 2:1-8, 13-17",
      "gospel": "Luke 20:27-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-11-19": {
      "sundayName": "25th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 98",
      "ot": "Malachi 4:1-6",
      "epistle": "2 Thessalonians 3:(1-5) 6-13",
      "gospel": "Luke 21:5-28 (29-36)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-11-23": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-11-26": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2034",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Malachi 3:13-18",
      "epistle": "Colossians 1:13-20",
      "gospel": "Luke 23:27-43",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2034-12-03": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 122",
      "ot": "Isaiah 2:1-5",
      "epistle": "Romans 13:(8-10) 11-14",
      "gospel": "Matthew 21:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-12-10": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 72:1-7",
      "ot": "Isaiah 11:1-10",
      "epistle": "Romans 15:4-13",
      "gospel": "Matthew 3:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-12-17": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:1-10",
      "epistle": "James 5:7-11",
      "gospel": "Matthew 11:2-15",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-12-24": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 24",
      "ot": "Isaiah 7:10-17",
      "epistle": "Romans 1:1-7",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2034-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2034-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2034-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "First Sunday after Christmas",
          "psalm": "Psalm 111",
          "ot": "Isaiah 63:7-14",
          "epistle": "Galatians 4:4-7",
          "gospel": "Matthew 2:13-23"
        }
      ]
    },
    "2035-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-01-07": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 29",
      "ot": "Isaiah 42:1-9",
      "epistle": "Romans 6:1-11",
      "gospel": "Matthew 3:13-17",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-01-14": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Isaiah 49:1-7",
      "epistle": "1 Corinthians 1:1-9",
      "gospel": "John 1:29-42a",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-01-21": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 27:1-9 (10-14)",
      "ot": "Isaiah 9:1-4",
      "epistle": "1 Corinthians 1:10-18",
      "gospel": "Matthew 4:12-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-01-28": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 15",
      "ot": "Micah 6:1-8",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2035-02-04": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 2:6-12",
      "ot": "Exodus 24:8-18",
      "epistle": "2 Peter 1:16-21",
      "gospel": "Matthew 17:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-02-07": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-02-11": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Genesis 3:1-21",
      "epistle": "Romans 5:12-19",
      "gospel": "Matthew 4:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-02-18": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Genesis 12:1-9",
      "epistle": "Romans 4:1-8, 13-17",
      "gospel": "John 3:1-17",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-02-25": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 95:1-9",
      "ot": "Exodus 17:1-7",
      "epistle": "Romans 5:1-8",
      "gospel": "John 4:5-26 (27-30, 39-42)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-03-04": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 142",
      "ot": "Isaiah 42:14-21",
      "epistle": "Ephesians 5:8-14",
      "gospel": "John 9:1-41",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-03-11": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 130",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Romans 8:1-11",
      "gospel": "John 11:1-45 (46-53)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-03-18": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 118:19-29",
      "ot": "Isaiah 50:4-9a",
      "epistle": "Philippians 2:5-11",
      "gospel": "Matthew 26:1-27:66",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-03-22": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "Hebrews 9:11-22",
      "gospel": "Matthew 26:17-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-03-23": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-03-25": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 16",
      "ot": "Acts 10:34-43",
      "epistle": "Colossians 3:1-4",
      "gospel": "Matthew 28:1-10",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 14:10-15:1",
          "epistle": "1 Corinthians 15:1-11",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2035-04-01": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 148",
      "ot": "Acts 5:29-42",
      "epistle": "1 Peter 1:3-9",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-04-08": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 116:1-14",
      "ot": "Acts 2:14a, 36-41",
      "epistle": "1 Peter 1:17-25",
      "gospel": "Luke 24:13-35",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-04-15": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Acts 2:42-47",
      "epistle": "1 Peter 2:19-25",
      "gospel": "John 10:1-10",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-04-22": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Acts 6:1-9; 7:2a, 51-60",
      "epistle": "1 Peter 2:2-10",
      "gospel": "John 14:1-14",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-04-29": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 66:8-20",
      "ot": "Acts 17:16-31",
      "epistle": "1 Peter 3:13-22",
      "gospel": "John 14:15-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-05-03": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-05-06": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 68:1-10",
      "ot": "Acts 1:12-26",
      "epistle": "1 Peter 4:12-19; 5:6-11",
      "gospel": "John 17:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-05-13": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 25:1-15",
      "ot": "Numbers 11:24-30",
      "epistle": "Acts 2:1-21",
      "gospel": "John 7:37-39",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-05-20": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 8",
      "ot": "Genesis 1:1-2:4a",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "Matthew 28:16-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-05-27": {
      "sundayName": "2nd Sunday after Pentecost (prop3)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 115:( 1-8 ) 9-18",
      "ot": "Isaiah 49:8-16a",
      "epistle": "Romans 1:8-17",
      "gospel": "Matthew 6:24-34",
      "source": "yaag.org"
    },
    "2035-06-03": {
      "sundayName": "3rd Sunday after Pentecost (prop4)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 4",
      "ot": "Deuteronomy 11:18-21, 26-28",
      "epistle": "Romans 3:21-28",
      "gospel": "Matthew 7:15-29",
      "source": "yaag.org"
    },
    "2035-06-10": {
      "sundayName": "4th Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 119:65-72",
      "ot": "Hosea 5:15-6:6",
      "epistle": "Romans 4:13-25",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-06-17": {
      "sundayName": "5th Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 100",
      "ot": "Exodus 19:2-8",
      "epistle": "Romans 5:6-15",
      "gospel": "Matthew 9:35-10:8 (9-20)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-06-24": {
      "sundayName": "6th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 91:1-10 (11-16)",
      "ot": "Jeremiah 20:7-13",
      "epistle": "Romans 6:12-23",
      "gospel": "Matthew 10:5a, 21-33",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2035-07-01": {
      "sundayName": "7th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 119:153-160",
      "ot": "Jeremiah 28:5-9",
      "epistle": "Romans 7:1-13",
      "gospel": "Matthew 10:34-42",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-07-08": {
      "sundayName": "8th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 145:1-14",
      "ot": "Zechariah 9:9-12",
      "epistle": "Romans 7:14-25a",
      "gospel": "Matthew 11:25-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-07-15": {
      "sundayName": "9th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 65:(1-8) 9-13",
      "ot": "Isaiah 55:10-13",
      "epistle": "Romans 8:12-17",
      "gospel": "Matthew 13:1-9, 18-23",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-07-22": {
      "sundayName": "10th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 119:57-64",
      "ot": "Isaiah 44:6-8",
      "epistle": "Romans 8:18-27",
      "gospel": "Matthew 13:24-30, 36-43",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-07-29": {
      "sundayName": "11th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 125",
      "ot": "Deuteronomy 7:6-9",
      "epistle": "Romans 8:28-39",
      "gospel": "Matthew 13:44-52",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-08-05": {
      "sundayName": "12th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 136:1-9 (23-26)",
      "ot": "Isaiah 55:1-5",
      "epistle": "Romans 9:1-5 (6-13)",
      "gospel": "Matthew 14:13-21",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-08-12": {
      "sundayName": "13th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 18:1-6 (7-16)",
      "ot": "Job 38:4-18",
      "epistle": "Romans 10:5-17",
      "gospel": "Matthew 14:22-33",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-08-19": {
      "sundayName": "14th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Isaiah 56:1, 6-8",
      "epistle": "Romans 11:1-2a, 13-15, 28-32",
      "gospel": "Matthew 15:21-28",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2035-08-26": {
      "sundayName": "15th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 138",
      "ot": "Isaiah 51:1-6",
      "epistle": "Romans 11:33-12:8",
      "gospel": "Matthew 16:13-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-09-02": {
      "sundayName": "16th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 26",
      "ot": "Jeremiah 15:15-21",
      "epistle": "Romans 12:9-21",
      "gospel": "Matthew 16:21-28",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-09-09": {
      "sundayName": "17th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 32:1-7",
      "ot": "Ezekiel 33:7-9",
      "epistle": "Romans 13:1-10",
      "gospel": "Matthew 18:1-20",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2035-09-16": {
      "sundayName": "18th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 103:1-12",
      "ot": "Genesis 50:15-21",
      "epistle": "Romans 14:1-12",
      "gospel": "Matthew 18:21-35",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2035-09-23": {
      "sundayName": "19th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 27:1-9",
      "ot": "Isaiah 55:6-9",
      "epistle": "Philippians 1:12-14, 19-30",
      "gospel": "Matthew 20:1-16",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-09-30": {
      "sundayName": "20th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 25:1-10",
      "ot": "Ezekiel 18:1-4, 25-32",
      "epistle": "Philippians 2:1-4 (5-13) 14-18",
      "gospel": "Matthew 21:23-27 (28-32)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-10-07": {
      "sundayName": "21st Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 80:7-19",
      "ot": "Isaiah 5:1-7",
      "epistle": "Philippians 3:4b-14",
      "gospel": "Matthew 21:33-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-10-14": {
      "sundayName": "22nd Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 23",
      "ot": "Isaiah 25:6-9",
      "epistle": "Philippians 4:4-13",
      "gospel": "Matthew 22:1-14",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-10-21": {
      "sundayName": "23rd Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 96:1-9 (10-13)",
      "ot": "Isaiah 45:1-7",
      "epistle": "1 Thessalonians 1:1-10",
      "gospel": "Matthew 22:15-22",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-10-28": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "24th Sunday after Pentecost (prop25)",
          "psalm": "Psalm 1",
          "ot": "Leviticus 19:1-2, 15-18",
          "epistle": "1 Thessalonians 2:1-13",
          "gospel": "Matthew 22:34-46"
        }
      ]
    },
    "2035-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-11-04": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "25th Sunday after Pentecost (prop26)",
          "psalm": "Psalm 43 ( 3 )",
          "ot": "Micah 3:5-12",
          "epistle": "1 Thessalonians 4:1-12",
          "gospel": "Matthew 23:1-12"
        }
      ]
    },
    "2035-11-11": {
      "sundayName": "26th Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 70",
      "ot": "Amos 5:18-24",
      "epistle": "1 Thessalonians 4:13-18",
      "gospel": "Matthew 25:1-13",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-11-18": {
      "sundayName": "27th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 90:1-12",
      "ot": "Zephaniah 1:7-16",
      "epistle": "1 Thessalonians 5:1-11",
      "gospel": "Matthew 25:14-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-11-22": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-11-25": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2035",
      "series": "A",
      "psalm": "Psalm 95:1-7a",
      "ot": "Ezekiel 34:11-16, 20-24",
      "epistle": "1 Corinthians 15:20-28",
      "gospel": "Matthew 25:31-46",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-12-02": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 80:1-7",
      "ot": "Isaiah 64:1-9",
      "epistle": "1 Corinthians 1:3-9",
      "gospel": "Mark 11:1-10",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-09": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 85",
      "ot": "Isaiah 40:1-11",
      "epistle": "2 Peter 3:8-14",
      "gospel": "Mark 1:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-16": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 126",
      "ot": "Isaiah 61:1-4, 8-11",
      "epistle": "1 Thessalonians 5:16-24",
      "gospel": "John 1:6-8, 19-28",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-23": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 89:1-5 (19-29)",
      "ot": "2 Samuel 7:1-11, 16",
      "epistle": "Romans 16:25-27",
      "gospel": "Luke 1:26-38",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2035-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-28": {
      "sundayName": "The Holy Innocents, Martyrs",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 31:15-17",
      "epistle": "Revelation 14:1-5",
      "gospel": "Matthew 2:13-18",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2035-12-30": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Isaiah 61:10-62:3",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 2:22-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2035-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-01-13": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Genesis 1:1-5",
      "epistle": "Romans 6:1-11",
      "gospel": "Mark 1:4-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-01-18": {
      "sundayName": "The Confession of St. Peter",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Acts 4:8-13",
      "epistle": "2 Peter 1:1-15",
      "gospel": "Mark 8:27-35 (36-9:1)",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2036-01-20": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 139:1-10",
      "ot": "1 Samuel 3:1-10 (11-20)",
      "epistle": "1 Corinthians 6:12-20",
      "gospel": "John 1:43-51",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-01-25": {
      "sundayName": "The Conversion of St. Paul",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Acts 9:1-22",
      "epistle": "Galatians 1:11-24",
      "gospel": "Matthew 19:27-30",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2036-01-27": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 62",
      "ot": "Jonah 3:1-5, 10",
      "epistle": "1 Corinthians 7:29-31 (32-35)",
      "gospel": "Mark 1:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2036-02-03": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 111",
      "ot": "Deuteronomy 18:15-20",
      "epistle": "1 Corinthians 8:1-13",
      "gospel": "Mark 1:21-28",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-02-10": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 147:1-11 ( 5 )",
      "ot": "Isaiah 40:21-31",
      "epistle": "1 Corinthians 9:16-27",
      "gospel": "Mark 1:29-39",
      "source": "yaag.org"
    },
    "2036-02-17": {
      "sundayName": "Sixth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 30 ( 2 )",
      "ot": "2 Kings 5:1-14",
      "epistle": "1 Corinthians 10:( 19-30 ) 31-11:1",
      "gospel": "Mark 1:40-45",
      "source": "yaag.org"
    },
    "2036-02-24": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 50:1-6",
      "ot": "2 Kings 2:1-12",
      "epistle": "2 Corinthians 3:12-13 (14-18); 4:1-6",
      "gospel": "Mark 9:2-9",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-02-27": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:1-6, 16-21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-03-02": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 25:1-10",
      "ot": "Genesis 22:1-18",
      "epistle": "James 1:12-18",
      "gospel": "Mark 1:9-15",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-03-09": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 22:23-31",
      "ot": "Genesis 17:1-7, 15-16",
      "epistle": "Romans 5:1-11",
      "gospel": "Mark 8:27-38",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-03-16": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 19",
      "ot": "Exodus 20:1-17",
      "epistle": "1 Corinthians 1:18-31",
      "gospel": "John 2:13-22 (23-25)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-03-23": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 107:1-9",
      "ot": "Numbers 21:4-9",
      "epistle": "Ephesians 2:1-10",
      "gospel": "John 3:14-21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-03-30": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 5:1-10",
      "gospel": "Mark 10:(32-34) 35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-04-06": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 118:19-29",
      "ot": "Zechariah 9:9-12",
      "epistle": "Philippians 2:5-11",
      "gospel": "Mark 14:1-15:47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-04-10": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 116:12-19",
      "ot": "Exodus 24:3-11",
      "epistle": "1 Corinthians 10:16-17",
      "gospel": "Mark 14:12-26",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-04-11": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-04-13": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Isaiah 25:6-9",
      "epistle": "1 Corinthians 15:1-11",
      "gospel": "Mark 16:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Exodus 15:1-11",
          "epistle": "1 Corinthians 5:6b-8",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2036-04-20": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 148",
      "ot": "Acts 4:32-35",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-04-27": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 4",
      "ot": "Acts 3:11-21",
      "epistle": "1 John 3:1-7",
      "gospel": "Luke 24:36-49",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-05-04": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Acts 4:1-12",
      "epistle": "1 John 3:16-24",
      "gospel": "John 10:11-18",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-05-11": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 150",
      "ot": "Acts 8:26-40",
      "epistle": "1 John 4:1-11 (12-21)",
      "gospel": "John 15:1-8",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-05-18": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 98",
      "ot": "Acts 10:34-48",
      "epistle": "1 John 5:1-8",
      "gospel": "John 15:9-17",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-05-22": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-05-25": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 1",
      "ot": "Acts 1:12-26",
      "epistle": "1 John 5:9-15",
      "gospel": "John 17:11b-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-06-01": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 139:1-12 (13-16)",
      "ot": "Ezekiel 37:1-14",
      "epistle": "Acts 2:1-21",
      "gospel": "John 15:26-27; 16:4b-15",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-06-08": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 29",
      "ot": "Isaiah 6:1-8",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 3:1-17",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-06-15": {
      "sundayName": "2nd Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 1",
      "ot": "Ezekiel 17:22-24",
      "epistle": "2 Corinthians 5:1-10 (11-17)",
      "gospel": "Mark 4:26-34",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-06-22": {
      "sundayName": "3rd Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 124",
      "ot": "Job 38:1-11",
      "epistle": "2 Corinthians 6:1-13",
      "gospel": "Mark 4:35-41",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-06-29": {
      "sundayName": "4th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 30",
      "ot": "Lamentations 3:22-33",
      "epistle": "2 Corinthians 8:1-9, 13-15",
      "gospel": "Mark 5:21-43",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "St. Peter and St. Paul, Apostles",
          "psalm": "Psalm 46",
          "ot": "Acts 15:1-12 (13-21)",
          "epistle": "Galatians 2:1-10",
          "gospel": "Matthew 16:13-19"
        }
      ]
    },
    "2036-07-06": {
      "sundayName": "5th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 123",
      "ot": "Ezekiel 2:1-5",
      "epistle": "2 Corinthians 12:1-10",
      "gospel": "Mark 6:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-07-13": {
      "sundayName": "6th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 85:(1-7) 8-13",
      "ot": "Amos 7:7-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-07-20": {
      "sundayName": "7th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 23",
      "ot": "Jeremiah 23:1-6",
      "epistle": "Ephesians 2:11-22",
      "gospel": "Mark 6:30-44",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-07-27": {
      "sundayName": "8th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 136:1-9",
      "ot": "Genesis 9:8-17",
      "epistle": "Ephesians 3:14-21",
      "gospel": "Mark 6:45-56",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-08-03": {
      "sundayName": "9th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 145:10-21",
      "ot": "Exodus 16:2-15",
      "epistle": "Ephesians 4:1-16",
      "gospel": "John 6:22-35",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-08-10": {
      "sundayName": "10th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 34:1-8",
      "ot": "1 Kings 19:1-8",
      "epistle": "Ephesians 4:17-5:2",
      "gospel": "John 6:35-51",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-08-17": {
      "sundayName": "11th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 34:12-22",
      "ot": "Proverbs 9:1-10",
      "epistle": "Ephesians 5:6-21",
      "gospel": "John 6:51-69",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-08-24": {
      "sundayName": "12th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 14",
      "ot": "Isaiah 29:11-19",
      "epistle": "Ephesians 5:22-33",
      "gospel": "Mark 7:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "St. Bartholomew, Apostle",
          "psalm": "Psalm 121",
          "ot": "Proverbs 3:1-8",
          "epistle": "2 Corinthians 4:7-10",
          "gospel": "Luke 22:24-30"
        }
      ]
    },
    "2036-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-08-31": {
      "sundayName": "13th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 119:129-136",
      "ot": "Deuteronomy 4:1-2, 6-9",
      "epistle": "Ephesians 6:10-20",
      "gospel": "Mark 7:14-23",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-09-07": {
      "sundayName": "14th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:4-7a",
      "epistle": "James 2:1-10, 14-18",
      "gospel": "Mark 7:(24-30) 31-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-09-14": {
      "sundayName": "15th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 116:1-9",
      "ot": "Isaiah 50:4-10",
      "epistle": "James 3:1-12",
      "gospel": "Mark 9:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "Holy Cross Day",
          "psalm": "Psalm 40:1-11",
          "ot": "Numbers 21:4-9",
          "epistle": "1 Corinthians 1:18-25",
          "gospel": "John 12:20-33"
        }
      ]
    },
    "2036-09-21": {
      "sundayName": "16th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 54",
      "ot": "Jeremiah 11:18-20",
      "epistle": "James 3:13-4:10",
      "gospel": "Mark 9:30-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "St. Matthew, Apostle and Evangelist",
          "psalm": "Psalm 119:33-40",
          "ot": "Ezekiel 2:8-3:11",
          "epistle": "Ephesians 4:7-16",
          "gospel": "Matthew 9:9-13"
        }
      ]
    },
    "2036-09-28": {
      "sundayName": "17th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 104:27-35",
      "ot": "Numbers 11:4-6, 10-16, 24-29",
      "epistle": "James 5:(1-12) 13-20",
      "gospel": "Mark 9:38-50",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-10-05": {
      "sundayName": "18th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 128",
      "ot": "Genesis 2:18-25",
      "epistle": "Hebrews 2:1-13 (14-18)",
      "gospel": "Mark 10:2-16",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-10-12": {
      "sundayName": "19th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 90:12-17",
      "ot": "Amos 5:6-7, 10-15",
      "epistle": "Hebrews 3:12-19",
      "gospel": "Mark 10:17-22",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-10-18": {
      "sundayName": "St. Luke, Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 147:1-11",
      "ot": "Isaiah 35:5-8",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Luke 10:1-9",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2036-10-19": {
      "sundayName": "20th Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 119:9-16",
      "ot": "Ecclesiastes 5:10-20",
      "epistle": "Hebrews 4:1-13 (14-16)",
      "gospel": "Mark 10:23-31",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-10-26": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "21st Sunday after Pentecost (prop25)",
          "psalm": "Psalm 126",
          "ot": "Jeremiah 31:7-9",
          "epistle": "Hebrews 7:23-28",
          "gospel": "Mark 10:46-52"
        }
      ]
    },
    "2036-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-11-02": {
      "sundayName": "All Saints' Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop26)",
          "psalm": "Psalm 119:1-8 ( 5 )",
          "ot": "Deuteronomy 6:1-9",
          "epistle": "Hebrews 9:11-14 ( 15-22 )",
          "gospel": "Mark 12:28-37"
        }
      ]
    },
    "2036-11-09": {
      "sundayName": "23rd Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 146",
      "ot": "1 Kings 17:8-16",
      "epistle": "Hebrews 9:24-28",
      "gospel": "Mark 12:38-44",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-11-16": {
      "sundayName": "24th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 16",
      "ot": "Daniel 12:1-3",
      "epistle": "Hebrews 10:11-25",
      "gospel": "Mark 13:1-13",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-11-23": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 93",
      "ot": "Isaiah 51:4-6",
      "epistle": "Jude 20-25",
      "gospel": "Mark 13:24-37",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-11-27": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2036",
      "series": "B",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-11-30": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 25:1-10",
      "ot": "Jeremiah 33:14-16",
      "epistle": "1 Thessalonians 3:9-13",
      "gospel": "Luke 19:28-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2036-12-07": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 66:1-12",
      "ot": "Malachi 3:1-7b",
      "epistle": "Philippians 1:2-11",
      "gospel": "Luke 3:1-14 (15-20)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2036-12-14": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Zephaniah 3:14-20",
      "epistle": "Philippians 4:4-7",
      "gospel": "Luke 7:18-28 (29-35)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2036-12-21": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 80:1-7",
      "ot": "Micah 5:2-5a",
      "epistle": "Hebrews 10:5-10",
      "gospel": "Luke 1:39-45 (46-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2036-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2036-12-27": {
      "sundayName": "St. John, Apostle and Evangelist",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 11",
      "ot": "Revelation 1:1-6",
      "epistle": "1 John 1:1-2:2",
      "gospel": "John 21:20-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2036-12-28": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Exodus 13:1-3a, 11-15",
      "epistle": "Colossians 3:12-17",
      "gospel": "Luke 2:22-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Holy Innocents, Martyrs",
          "psalm": "Psalm 54",
          "ot": "Jeremiah 31:15-17",
          "epistle": "Revelation 14:1-5",
          "gospel": "Matthew 2:13-18"
        }
      ]
    },
    "2036-12-31": {
      "sundayName": "Eve of the Circumcision and Name of Jesus (New Year's Eve)",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 90:1-12",
      "ot": "Isaiah 30:(8-14) 15-17",
      "epistle": "Romans 8:31b-39",
      "gospel": "Luke 12:35-40",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-01-01": {
      "sundayName": "Circumcision and Name of Jesus (New Year's Day)",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Numbers 6:22-27",
      "epistle": "Galatians 3:23-29",
      "gospel": "Luke 2:21",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-01-04": {
      "sundayName": "Second Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 119:97-104",
      "ot": "1 Kings 3:4-15",
      "epistle": "Ephesians 1:3-14",
      "gospel": "Luke 2:40-52",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-01-06": {
      "sundayName": "The Epiphany of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 72:1-11 (12-15)",
      "ot": "Isaiah 60:1-6",
      "epistle": "Ephesians 3:1-12",
      "gospel": "Matthew 2:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-01-11": {
      "sundayName": "The Baptism of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 29",
      "ot": "Isaiah 43:1-7",
      "epistle": "Romans 6:1-11",
      "gospel": "Luke 3:15-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-01-18": {
      "sundayName": "Second Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 128",
      "ot": "Isaiah 62:1-5",
      "epistle": "1 Corinthians 12:1-11",
      "gospel": "John 2:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Confession of St. Peter",
          "psalm": "Psalm 118:19-29",
          "ot": "Acts 4:8-13",
          "epistle": "2 Peter 1:1-15",
          "gospel": "Mark 8:27-35 (36-9:1)"
        }
      ]
    },
    "2037-01-24": {
      "sundayName": "St. Timothy, Pastor and Confessor",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 71:15-24",
      "ot": "Acts 16:1-5",
      "epistle": "1 Timothy 6:11-16",
      "gospel": "Matthew 24:42-47",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-01-25": {
      "sundayName": "Third Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 19:(1-6) 7-14",
      "ot": "Nehemiah 8:1-3, 5-6, 8-10",
      "epistle": "1 Corinthians 12:12-31a",
      "gospel": "Luke 4:16-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Conversion of St. Paul",
          "psalm": "Psalm 67",
          "ot": "Acts 9:1-22",
          "epistle": "Galatians 1:11-24",
          "gospel": "Matthew 19:27-30"
        }
      ]
    },
    "2037-02-01": {
      "sundayName": "Fourth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 71:1-6 ( 7-11 ) ( 12 )",
      "ot": "Jeremiah 1:4-10 ( 17-19 )",
      "epistle": "1 Corinthians 12:31b-13:13",
      "gospel": "Luke 4:31-44",
      "source": "yaag.org"
    },
    "2037-02-02": {
      "sundayName": "The Purification of Mary and the Presentation of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 84",
      "ot": "1 Samuel 1:21-28",
      "epistle": "Hebrews 2:14-18",
      "gospel": "Luke 2:22-32 (33-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-02-08": {
      "sundayName": "Fifth Sunday after the Epiphany",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Isaiah 6:1-8 (9-13)",
      "epistle": "1 Corinthians 14:12b-20",
      "gospel": "Luke 5:1-11",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-02-15": {
      "sundayName": "The Transfiguration of Our Lord",
      "season": "Epiphany",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 99",
      "ot": "Deuteronomy 34:1-12",
      "epistle": "Hebrews 3:1-6",
      "gospel": "Luke 9:28-36",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-02-18": {
      "sundayName": "Ash Wednesday",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 51:1-13 (14-19)",
      "ot": "Joel 2:12-19",
      "epistle": "2 Corinthians 5:20b-6:10",
      "gospel": "Matthew 6:(1-6) 16-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-02-22": {
      "sundayName": "First Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 91:1-13",
      "ot": "Deuteronomy 26:1-11",
      "epistle": "Romans 10:8b-13",
      "gospel": "Luke 4:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-03-01": {
      "sundayName": "Second Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 4",
      "ot": "Jeremiah 26:8-15",
      "epistle": "Philippians 3:17-4:1",
      "gospel": "Luke 13:31-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-03-08": {
      "sundayName": "Third Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 85",
      "ot": "Ezekiel 33:7-20",
      "epistle": "1 Corinthians 10:1-13",
      "gospel": "Luke 13:1-9",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-03-15": {
      "sundayName": "Fourth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 32",
      "ot": "Isaiah 12:1-6",
      "epistle": "2 Corinthians 5:16-21",
      "gospel": "Luke 15:1-3, 11-32",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-03-22": {
      "sundayName": "Fifth Sunday in Lent",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 126",
      "ot": "Isaiah 43:16-21",
      "epistle": "Philippians 3:(4b-7) 8-14",
      "gospel": "Luke 20:9-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-03-29": {
      "sundayName": "Palm Sunday (Sunday of the Passion)",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 118:19-29",
      "ot": "Deuteronomy 32:36-39",
      "epistle": "Philippians 2:5-11",
      "gospel": "Luke 22:1-23:56",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-04-02": {
      "sundayName": "Holy (Maundy) Thursday",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 116:12-19",
      "ot": "Jeremiah 31:31-34",
      "epistle": "Hebrews 10:15-25",
      "gospel": "Luke 22:7-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-04-03": {
      "sundayName": "Good Friday",
      "season": "Lent",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 22",
      "ot": "Isaiah 52:13-53:12",
      "epistle": "Hebrews 4:14-16; 5:7-9",
      "gospel": "John 18:1-19:42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-04-05": {
      "sundayName": "The Resurrection of Our Lord (Easter Day)",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "Isaiah 65:17-25",
      "epistle": "1 Corinthians 15:19-26",
      "gospel": "Luke 24:1-12",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "The Resurrection of Our Lord (Sunrise)",
          "psalm": "Psalm 118:15-29",
          "ot": "Job 19:23-27",
          "epistle": "1 Corinthians 15:51-57",
          "gospel": "John 20:1-18"
        }
      ]
    },
    "2037-04-12": {
      "sundayName": "Second Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 5:12-20 (21-32)",
      "epistle": "Revelation 1:4-18",
      "gospel": "John 20:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-04-19": {
      "sundayName": "Third Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 30",
      "ot": "Acts 9:1-22",
      "epistle": "Revelation 5:(1-7) 8-14",
      "gospel": "John 21:1-14 (15-19)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-04-25": {
      "sundayName": "St. Mark, Evangelist",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Isaiah 52:7-10",
      "epistle": "2 Timothy 4:5-18",
      "gospel": "Mark 16:14-20",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-04-26": {
      "sundayName": "Fourth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 23",
      "ot": "Acts 20:17-35",
      "epistle": "Revelation 7:9-17",
      "gospel": "John 10:22-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-05-03": {
      "sundayName": "Fifth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Acts 11:1-18",
      "epistle": "Revelation 21:1-7",
      "gospel": "John 16:12-22",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-05-10": {
      "sundayName": "Sixth Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Acts 16:9-15",
      "epistle": "Revelation 21:9-14, 21-27",
      "gospel": "John 16:23-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-05-14": {
      "sundayName": "The Ascension of Our Lord",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 47",
      "ot": "Acts 1:1-11",
      "epistle": "Ephesians 1:15-23",
      "gospel": "Luke 24:44-53",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-05-17": {
      "sundayName": "Seventh Sunday of Easter",
      "season": "Easter",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 133",
      "ot": "Acts 1:12-26",
      "epistle": "Revelation 22:1-6 (7-11) 12-20",
      "gospel": "John 17:20-26",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-05-24": {
      "sundayName": "The Day of Pentecost",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 143",
      "ot": "Genesis 11:1-9",
      "epistle": "Acts 2:1-21",
      "gospel": "John 14:23-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-05-31": {
      "sundayName": "The Holy Trinity",
      "season": "Trinity",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 8",
      "ot": "Proverbs 8:1-4, 22-31",
      "epistle": "Acts 2:14a, 22-36",
      "gospel": "John 8:48-59",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-06-07": {
      "sundayName": "2nd Sunday after Pentecost (prop5)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 30 ( 5b )",
      "ot": "1 Kings 17:17-24",
      "epistle": "Galatians 1:11-24",
      "gospel": "Luke 7:11-17",
      "source": "yaag.org"
    },
    "2037-06-14": {
      "sundayName": "3rd Sunday after Pentecost (prop6)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 32:1-7 ( 2 )",
      "ot": "2 Samuel 11:26-12:10, 13-14",
      "epistle": "Galatians 2:15-21; 3:10-14",
      "gospel": "Luke 7:36-8:3",
      "source": "yaag.org"
    },
    "2037-06-21": {
      "sundayName": "4th Sunday after Pentecost (prop7)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 3",
      "ot": "Isaiah 65:1-9",
      "epistle": "Galatians 3:23-4:7",
      "gospel": "Luke 8:26-39",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-06-28": {
      "sundayName": "5th Sunday after Pentecost (prop8)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 16",
      "ot": "1 Kings 19:9b-21",
      "epistle": "Galatians 5:1, 13-25",
      "gospel": "Luke 9:51-62",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-06-29": {
      "sundayName": "St. Peter and St. Paul, Apostles",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Acts 15:1-12 (13-21)",
      "epistle": "Galatians 2:1-10",
      "gospel": "Matthew 16:13-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-07-05": {
      "sundayName": "6th Sunday after Pentecost (prop9)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 66:1-7",
      "ot": "Isaiah 66:10-14",
      "epistle": "Galatians 6:1-10, 14-18",
      "gospel": "Luke 10:1-20",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-07-12": {
      "sundayName": "7th Sunday after Pentecost (prop10)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 41",
      "ot": "Leviticus (18:1-5) 19:9-18",
      "epistle": "Colossians 1:1-14",
      "gospel": "Luke 10:25-37",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-07-19": {
      "sundayName": "8th Sunday after Pentecost (prop11)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 27:(1-6) 7-14",
      "ot": "Genesis 18:1-10a (10b-14)",
      "epistle": "Colossians 1:21-29",
      "gospel": "Luke 10:38-42",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-07-25": {
      "sundayName": "St. James the Elder, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 56",
      "ot": "Acts 11:27-12:5",
      "epistle": "Romans 8:28-39",
      "gospel": "Mark 10:35-45",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-07-26": {
      "sundayName": "9th Sunday after Pentecost (prop12)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 138",
      "ot": "Genesis 18:(17-19) 20-33",
      "epistle": "Colossians 2:6-15 (16-19)",
      "gospel": "Luke 11:1-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-08-02": {
      "sundayName": "10th Sunday after Pentecost (prop13)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 100",
      "ot": "Ecclesiastes 1:2, 12-14; 2:18-26",
      "epistle": "Colossians 3:1-11",
      "gospel": "Luke 12:13-21",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-08-09": {
      "sundayName": "11th Sunday after Pentecost (prop14)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 33:12-22",
      "ot": "Genesis 15:1-6",
      "epistle": "Hebrews 11:1-16",
      "gospel": "Luke 12:22-34 (35-40)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-08-15": {
      "sundayName": "St. Mary, Mother of Our Lord",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 45:10-17",
      "ot": "Isaiah 61:7-11",
      "epistle": "Galatians 4:4-7",
      "gospel": "Luke 1:(39-45) 46-55",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-08-16": {
      "sundayName": "12th Sunday after Pentecost (prop15)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 119:81-88",
      "ot": "Jeremiah 23:16-29",
      "epistle": "Hebrews 11:17-31 (32-40); 12:1-3",
      "gospel": "Luke 12:49-53 (54-56)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-08-23": {
      "sundayName": "13th Sunday after Pentecost (prop16)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 50:1-15",
      "ot": "Isaiah 66:18-23",
      "epistle": "Hebrews 12:4-24 (25-29)",
      "gospel": "Luke 13:22-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-08-24": {
      "sundayName": "St. Bartholomew, Apostle",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Proverbs 3:1-8",
      "epistle": "2 Corinthians 4:7-10",
      "gospel": "Luke 22:24-30",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-08-29": {
      "sundayName": "The Martyrdom of St. John the Baptist",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 71:1-8",
      "ot": "Revelation 6:9-11",
      "epistle": "Romans 6:1-5",
      "gospel": "Mark 6:14-29",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-08-30": {
      "sundayName": "14th Sunday after Pentecost (prop17)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 131",
      "ot": "Proverbs 25:2-10",
      "epistle": "Hebrews 13:1-17",
      "gospel": "Luke 14:1-14",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-06": {
      "sundayName": "15th Sunday after Pentecost (prop18)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 1",
      "ot": "Deuteronomy 30:15-20",
      "epistle": "Philemon 1-21",
      "gospel": "Luke 14:25-35",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-13": {
      "sundayName": "16th Sunday after Pentecost (prop19)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 119:169-176",
      "ot": "Ezekiel 34:11-24",
      "epistle": "1 Timothy 1:(5-11) 12-17",
      "gospel": "Luke 15:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-14": {
      "sundayName": "Holy Cross Day",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 40:1-11",
      "ot": "Numbers 21:4-9",
      "epistle": "1 Corinthians 1:18-25",
      "gospel": "John 12:20-33",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-20": {
      "sundayName": "17th Sunday after Pentecost (prop20)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 113",
      "ot": "Amos 8:4-7",
      "epistle": "1 Timothy 2:1-15",
      "gospel": "Luke 16:1-15",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-21": {
      "sundayName": "St. Matthew, Apostle and Evangelist",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 119:33-40",
      "ot": "Ezekiel 2:8-3:11",
      "epistle": "Ephesians 4:7-16",
      "gospel": "Matthew 9:9-13",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-27": {
      "sundayName": "18th Sunday after Pentecost (prop21)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 146",
      "ot": "Amos 6:1-7",
      "epistle": "1 Timothy 3:1-13",
      "gospel": "Luke 16:19-31",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-09-29": {
      "sundayName": "St. Michael and All Angels",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 91",
      "ot": "Daniel 10:10-14; 12:1-3",
      "epistle": "Revelation 12:7-12",
      "gospel": "Matthew 18:1-11",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-10-04": {
      "sundayName": "19th Sunday after Pentecost (prop22)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 62",
      "ot": "Habakkuk 1:1-4; 2:1-4",
      "epistle": "2 Timothy 1:1-14",
      "gospel": "Luke 17:1-10",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-10-11": {
      "sundayName": "20th Sunday after Pentecost (prop23)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 111",
      "ot": "Ruth 1:1-19a",
      "epistle": "2 Timothy 2:1-13",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-10-18": {
      "sundayName": "21st Sunday after Pentecost (prop24)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 121",
      "ot": "Genesis 32:22-30",
      "epistle": "2 Timothy 3:14-4:5",
      "gospel": "Luke 18:1-8",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx",
      "alternates": [
        {
          "name": "St. Luke, Evangelist",
          "psalm": "Psalm 147:1-11",
          "ot": "Isaiah 35:5-8",
          "epistle": "2 Timothy 4:5-18",
          "gospel": "Luke 10:1-9"
        }
      ]
    },
    "2037-10-25": {
      "sundayName": "Reformation Day (observed)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "22nd Sunday after Pentecost (prop25)",
          "psalm": "Psalm 5",
          "ot": "Genesis 4:1-15",
          "epistle": "2 Timothy 4:6-8, 16-18",
          "gospel": "Luke 18:9-17"
        }
      ]
    },
    "2037-10-31": {
      "sundayName": "Reformation Day",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Revelation 14:6-7",
      "epistle": "Romans 3:19-28",
      "gospel": "John 8:31-36",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-11-01": {
      "sundayName": "All Saints' Day",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 149",
      "ot": "Revelation 7:(2-8) 9-17",
      "epistle": "1 John 3:1-3",
      "gospel": "Matthew 5:1-12",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "23rd Sunday after Pentecost (prop26)",
          "psalm": "Psalm 130",
          "ot": "Isaiah 1:10-18",
          "epistle": "2 Thessalonians 1:1-5 (6-10) 11-12",
          "gospel": "Luke 19:1-10"
        }
      ]
    },
    "2037-11-08": {
      "sundayName": "24th Sunday after Pentecost (prop27)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 148",
      "ot": "Exodus 3:1-15",
      "epistle": "2 Thessalonians 2:1-8, 13-17",
      "gospel": "Luke 20:27-40",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-11-15": {
      "sundayName": "25th Sunday after Pentecost (prop28)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 98",
      "ot": "Malachi 4:1-6",
      "epistle": "2 Thessalonians 3:(1-5) 6-13",
      "gospel": "Luke 21:5-28 (29-36)",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-11-22": {
      "sundayName": "Last Sunday of the Church Year (prop29)",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 46",
      "ot": "Malachi 3:13-18",
      "epistle": "Colossians 1:13-20",
      "gospel": "Luke 23:27-43",
      "source": "LCMS readings: LCMS-2024-2025-Church-Year-Calendar-Three-Year-Series-C.docx"
    },
    "2037-11-26": {
      "sundayName": "Day of National Thanksgiving",
      "season": "Pentecost",
      "churchYear": "CY2037",
      "series": "C",
      "psalm": "Psalm 67",
      "ot": "Deuteronomy 8:1-10",
      "epistle": "Philippians 4:6-20",
      "gospel": "Luke 17:11-19",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-11-29": {
      "sundayName": "First Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 122",
      "ot": "Isaiah 2:1-5",
      "epistle": "Romans 13:(8-10) 11-14",
      "gospel": "Matthew 21:1-11",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2037-12-06": {
      "sundayName": "Second Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 72:1-7",
      "ot": "Isaiah 11:1-10",
      "epistle": "Romans 15:4-13",
      "gospel": "Matthew 3:1-12",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2037-12-13": {
      "sundayName": "Third Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 146",
      "ot": "Isaiah 35:1-10",
      "epistle": "James 5:7-11",
      "gospel": "Matthew 11:2-15",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2037-12-20": {
      "sundayName": "Fourth Sunday in Advent",
      "season": "Advent",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 24",
      "ot": "Isaiah 7:10-17",
      "epistle": "Romans 1:1-7",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx"
    },
    "2037-12-24": {
      "sundayName": "The Nativity of Our Lord (Christmas Eve)",
      "season": "Christmas",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 110:1-4",
      "ot": "Isaiah 7:10-14",
      "epistle": "1 John 4:7-16",
      "gospel": "Matthew 1:18-25",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx"
    },
    "2037-12-25": {
      "sundayName": "The Nativity of Our Lord (Christmas Day)",
      "season": "Christmas",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 2",
      "ot": "Isaiah 52:7-10",
      "epistle": "Hebrews 1:1-6 (7-12)",
      "gospel": "John 1:1-14 (15-18)",
      "source": "LCMS readings: LCMS-2026-2027-Church-Year-Calendar-Three-Year-Series-B.docx",
      "alternates": [
        {
          "name": "The Nativity of Our Lord (Christmas Midnight)",
          "psalm": "Psalm 96",
          "ot": "Isaiah 9:2-7",
          "epistle": "Titus 2:11-14",
          "gospel": "Luke 2:1-14 (15-20)"
        },
        {
          "name": "The Nativity of Our Lord (Christmas Dawn)",
          "psalm": "Psalm 98",
          "ot": "Isaiah 62:10-12",
          "epistle": "Titus 3:4-7",
          "gospel": "Luke 2:(1-14) 15-20"
        }
      ]
    },
    "2037-12-27": {
      "sundayName": "First Sunday after Christmas",
      "season": "Christmas",
      "churchYear": "CY2038",
      "series": "A",
      "psalm": "Psalm 111",
      "ot": "Isaiah 63:7-14",
      "epistle": "Galatians 4:4-7",
      "gospel": "Matthew 2:13-23",
      "source": "LCMS readings: LCMS-2025-2026-Church-Year-Calendar-Three-Year-Series-A.docx",
      "alternates": [
        {
          "name": "St. John, Apostle and Evangelist",
          "psalm": "Psalm 11",
          "ot": "Revelation 1:1-6",
          "epistle": "1 John 1:1-2:2",
          "gospel": "John 21:20-25"
        }
      ]
    }
  }
}`;

