/* ==========================================================================
   REELNINJA — math.js
   The capacity calculator. Every figure it shows is arithmetic on the
   visitor's own inputs and on our PUBLISHED ladder. It never asserts a saving
   we have not priced, and it says out loud when their own editors are cheaper.

   Our side of the arithmetic uses exactly two published facts:
     1. the published monthly packages
     2. the published setup terms (first brand free, $120 per extra brand)
   It deliberately does NOT print our internal minutes or cost per video.
   Those are ours to manage; what the visitor pays is the ladder.
   ========================================================================== */

(function () {
  'use strict';

  /* ---- published constants. Change here, changes everywhere. ----
     Source: monthly packages set by Swarit, 2026-10-13 (replaced the $45 to
     $25 per-video ladder). Market context in Influenzo-biz-vault
     07-STRATEGIC/2026-09-23-white-label-pricing-research.md.

     Videos over a package are billed at that package's per-video rate, and
     the visitor is shown the cheapest package for their volume. Each option's
     cost only rises with volume, so the cheapest of them does too: adding a
     video can never lower the bill. Must match the table in src/index.html. */
  var PACKAGES = [
    { name: 'Starter', videos: 30,  price: 1050 },
    { name: 'Growth',  videos: 60,  price: 1800 },
    { name: 'Scale',   videos: 120, price: 3000 }
  ];
  var HOURS_PER_MONTH = 160;   // one full-time editor
  var EXTRA_BRAND = 120;       // setup per additional brand, USD; the first is free
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

  function rate(p) { return p.price / p.videos; }
  function optionCost(p, v) { return p.price + Math.max(0, v - p.videos) * rate(p); }

  /* Cheapest package for v videos in one month, and what it costs. */
  function bestFor(v) {
    var best = PACKAGES[0], cost = optionCost(best, v);
    for (var i = 1; i < PACKAGES.length; i++) {
      var c = optionCost(PACKAGES[i], v);
      if (c < cost) { best = PACKAGES[i]; cost = c; }
    }
    return { pkg: best, cost: cost, extra: Math.max(0, v - best.videos) };
  }
  function costFor(v) { return v > 0 ? bestFor(v).cost : 0; }
  var LOWEST_RATE = rate(PACKAGES[PACKAGES.length - 1]);

  /* Lowest monthly volume at which our average rate is at or below theirs.
     The average only falls as volume rises, so the first hit is the answer.
     Null when their rate is at or under our lowest per-video rate. */
  function breakEven(cpsThem) {
    if (cpsThem <= LOWEST_RATE) return null;
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

    var best = bestFor(videos);
    var costUs = videos > 0 ? best.cost : 0;
    var cpsUs = videos > 0 ? costUs / videos : 0;

    return {
      videos: videos, hours: hours, people: people, perEditor: perEditor,
      costThem: costThem, cpsThem: cpsThem,
      best: best, costUs: costUs, cpsUs: cpsUs,
      save: costThem - costUs, brk: breakEven(cpsThem)
    };
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
    el.tier.textContent = r.best.pkg.name + ', ' + money(r.best.pkg.price) +
      (r.best.extra ? ' + ' + num(r.best.extra) + ' extra at ' + money(rate(r.best.pkg)) : '');

    el.delta.textContent = num(r.videos) + ' videos a month costs you ' + money(r.costThem) +
      ' in editing today. On the system, on our published packages, ' + money(r.costUs) + '.';

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

    var setup = 'No setup fee for your first brand; ' + money(EXTRA_BRAND) + ' for each additional one.';
    if (r.videos < WORKABLE_AT) {
      el.slot.textContent = num(r.videos) + ' videos a month is under ' + WORKABLE_AT +
        '. At this volume a good freelancer is usually the better call, and we would rather say that now than on a call.';
    } else if (r.save > 0 && !same) {
      el.slot.textContent = setup + ' So the saving starts in month one.';
    } else {
      el.slot.textContent = setup + ' Even so, at this volume the system does not save you money; what it buys is the editors you do not have to hire.';
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
