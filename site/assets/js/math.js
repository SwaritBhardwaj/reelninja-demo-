/* ==========================================================================
   REELNINJA — math.js
   The capacity calculator. Every figure it shows is arithmetic on the
   visitor's own inputs and on our PUBLISHED ladder. It never asserts a saving
   we have not priced, and it says out loud when their own editors are cheaper.

   Our side of the arithmetic uses exactly two published facts:
     1. the published per-video ladder
     2. the published setup range
   It deliberately does NOT print our internal minutes or cost per video.
   Those are ours to manage; what the visitor pays is the ladder.
   ========================================================================== */

(function () {
  'use strict';

  /* ---- published constants. Change here, changes everywhere. ----
     Source: USD ladder set by Swarit, 2026-10-03: start at $45, step down $5
     a band, floor at $25. Market context in Influenzo-biz-vault
     07-STRATEGIC/2026-09-23-white-label-pricing-research.md.

     The ladder is GRADUATED, like tax brackets: each rate covers only the
     videos inside its band. The first 50 are $45, the next 100 are $40, and so
     on. That way adding a video can never lower the monthly bill, which an
     all-units ladder does at every band edge. Must match the table in
     src/index.html. */
  var LADDER = [
    { upTo: 50,       price: 45, label: '1 – 50' },
    { upTo: 150,      price: 40, label: '51 – 150' },
    { upTo: 300,      price: 35, label: '151 – 300' },
    { upTo: 500,      price: 30, label: '301 – 500' },
    { upTo: Infinity, price: 25, label: '501 +' }
  ];
  var HOURS_PER_MONTH = 160;   // one full-time editor
  var SETUP_LOW = 500;         // published setup range, USD
  var SETUP_HIGH = 2000;
  var WORKABLE_AT = 20;        // below this a good freelancer usually wins
  var SAME_WITHIN = 0.02;      // within 2% reads as "about the same"
  var BREAK_SEARCH_MAX = 20000;

  function $(id) { return document.getElementById(id); }

  var el = {
    creators: $('in-creators'), creatorsVal: $('val-creators'),
    videos: $('in-videos'), videosVal: $('val-videos'),
    minutes: $('in-minutes'), minutesVal: $('val-minutes'),
    rate: $('in-rate'),
    out: $('out'),
    big: $('out-big'), bigSub: $('out-big-sub'),
    hours: $('out-hours'), people: $('out-people'), perEditor: $('out-per-editor'),
    costThem: $('out-cost-them'), costUs: $('out-cost-us'),
    cpsThem: $('out-cps-them'), cpsUs: $('out-cps-us'),
    tier: $('out-tier'),
    delta: $('out-delta'), brk: $('out-break'), slot: $('out-slot'),
    peekVideos: $('peek-videos'), peekSave: $('peek-save')
  };
  if (!el.creators || !el.out) return;   // not on this page

  /* ---- formatters: the ladder is in USD ---- */
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function num(n, dp) {
    var v = dp ? n.toFixed(dp) : Math.round(n);
    return Number(v).toLocaleString('en-US');
  }

  /* 240 -> "4 hrs", 90 -> "1 hr 30 min", 45 -> "45 min" */
  function duration(min) {
    var h = Math.floor(min / 60), m = min % 60;
    var hs = h ? h + (h === 1 ? ' hr' : ' hrs') : '';
    return hs && m ? hs + ' ' + m + ' min' : (hs || m + ' min');
  }

  /* Graduated cost of v videos in one month. */
  function costFor(v) {
    var total = 0, prev = 0;
    for (var i = 0; i < LADDER.length && v > prev; i++) {
      total += (Math.min(v, LADDER[i].upTo) - prev) * LADDER[i].price;
      prev = LADDER[i].upTo;
    }
    return total;
  }
  function topBand(v) {
    for (var i = 0; i < LADDER.length; i++) if (v <= LADDER[i].upTo) return LADDER[i];
    return LADDER[LADDER.length - 1];
  }

  /* Lowest monthly volume at which our average rate is at or below theirs.
     The average only falls as volume rises, so the first hit is the answer.
     Null when their rate is at or under our lowest band. */
  function breakEven(cpsThem) {
    if (cpsThem <= LADDER[LADDER.length - 1].price) return null;
    for (var v = 1; v <= BREAK_SEARCH_MAX; v++) {
      if (costFor(v) / v <= cpsThem) return v;
    }
    return null;
  }

  function read() {
    var rate = parseFloat(el.rate.value);
    if (!isFinite(rate) || rate < 0) rate = 0;
    return {
      creators: +el.creators.value,
      perCreator: +el.videos.value,
      minutes: +el.minutes.value,
      rate: rate
    };
  }

  function compute(i) {
    var videos = i.creators * i.perCreator;
    var hours = (videos * i.minutes) / 60;
    var people = hours / HOURS_PER_MONTH;
    var perEditor = i.minutes > 0 ? (HOURS_PER_MONTH * 60) / i.minutes : 0;
    var costThem = hours * i.rate;
    var cpsThem = videos > 0 ? costThem / videos : 0;

    var costUs = costFor(videos);
    var cpsUs = videos > 0 ? costUs / videos : 0;

    return {
      videos: videos, hours: hours, people: people, perEditor: perEditor,
      costThem: costThem, cpsThem: cpsThem,
      band: topBand(videos), costUs: costUs, cpsUs: cpsUs,
      save: costThem - costUs, brk: breakEven(cpsThem)
    };
  }

  function months(n) {
    if (n < 1) return 'under a month';
    var r = Math.round(n * 10) / 10;
    return r === 1 ? '1 month' : r + ' months';
  }
  function monthRange(lo, hi) {
    var a = months(lo), b = months(hi);
    return a === b ? a : a + ' to ' + b;
  }

  function render() {
    var i = read();
    var r = compute(i);

    el.creatorsVal.textContent = num(i.creators) + (i.creators === 1 ? ' creator' : ' creators');
    el.videosVal.textContent = num(i.perCreator) + ' videos';
    el.minutesVal.textContent = duration(i.minutes);
    if (document.activeElement !== el.rate) el.rate.value = i.rate;

    el.big.textContent = num(r.videos) + (r.videos === 1 ? ' video' : ' videos') + ' a month';
    el.bigSub.textContent = 'At ' + duration(i.minutes) + ' a video, one full-time editor finishes about ' +
      num(Math.floor(r.perEditor)) + ' a month. This volume needs ' + num(r.people, 2) +
      ' of them, doing nothing else.';

    el.hours.textContent = num(r.hours) + ' hrs';
    el.people.textContent = num(r.people, 2) + ' editors';
    el.perEditor.textContent = num(Math.floor(r.perEditor)) + ' a month';
    el.costThem.textContent = money(r.costThem);
    el.costUs.textContent = money(r.costUs);
    el.cpsThem.textContent = money(r.cpsThem);
    el.cpsUs.textContent = money(r.cpsUs);
    el.tier.textContent = r.band.label + ' at ' + money(r.band.price);

    el.delta.textContent = num(r.videos) + ' videos a month costs you ' + money(r.costThem) +
      ' in editing today. On the system, at our published rates, ' + money(r.costUs) + '.';

    if (el.peekVideos) {
      el.peekVideos.textContent = num(r.videos) + ' videos a month';
      el.peekSave.textContent = r.save > 0
        ? money(r.save) + ' a month less'
        : r.save < 0 ? money(-r.save) + ' a month more' : 'Same cost';
    }

    var editors = '<strong>' + num(r.people, 2) + ' editors</strong>';
    var same = Math.abs(r.save) <= SAME_WITHIN * Math.max(r.costThem, r.costUs);

    if (same) {
      el.brk.innerHTML = 'At this volume we cost about the same as your editors. The difference is ' +
        editors + ' you never have to hire, train or manage.';
    } else if (r.save > 0) {
      el.brk.innerHTML = 'At this volume we are <strong>' + money(r.save) + ' a month cheaper</strong> ' +
        'than your editors, and that is before the ' + editors + ' you no longer have to hire.';
    } else if (r.brk !== null) {
      el.brk.innerHTML = 'At this volume your editors are ' + money(-r.save) + ' a month cheaper. ' +
        'We break even at <strong>' + num(r.brk) + ' videos a month</strong>. What the difference buys ' +
        'today is ' + editors + ' you do not have to hire.';
    } else {
      el.brk.innerHTML = 'At ' + money(r.cpsThem) + ' a video your editors are cheaper than our ' +
        'lowest published rate. <strong>On cost alone, keep them. We would say the same on the call.</strong>';
    }

    var setup = 'One-time setup of ' + money(SETUP_LOW) + ' – ' + money(SETUP_HIGH) +
      ', quoted before you commit.';
    if (r.videos < WORKABLE_AT) {
      el.slot.textContent = num(r.videos) + ' videos a month is under ' + WORKABLE_AT +
        '. At this volume a good freelancer is usually the better call, and we would rather say that now than on a call.';
    } else if (r.save > 0 && !same) {
      el.slot.textContent = setup + ' At this saving it pays for itself in ' +
        monthRange(SETUP_LOW / r.save, SETUP_HIGH / r.save) + '.';
    } else {
      el.slot.textContent = setup + ' At this volume it is an added cost, not something the savings pay back.';
    }
  }

  [el.creators, el.videos, el.minutes, el.rate].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  });
  el.rate.addEventListener('blur', function () {
    var v = parseFloat(el.rate.value);
    if (!isFinite(v) || v < 0) el.rate.value = 0;
    render();
  });

  render();
})();
