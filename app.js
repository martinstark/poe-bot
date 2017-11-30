'use strict';

const Discord = require('discord.js'),
  client = new Discord.Client(),
  config = require('./config.json'),
  fetch = require('node-fetch'),
  CURRENCY_CHART = {
    'ex'      : 'exalted orb',
    'vaal'    : 'vaal orb',
    'mirror'  : 'mirror of kalandra',
    'div'     : 'divine orb',
    'annul'   : 'orb of annulment',
    'master'  : 'master cartographer\'s sextant',
    'journey' : 'journeyman cartographer\'s sextant',
    'journey' : 'apprentice cartographer\'s sextant',
    'gem'     : 'gemcutter\'s prism',
    'regret'  : 'orb of regret',
    'scour'   : 'orb of scouring',
    'fus'     : 'orb of fusing',
    'regal'   : 'regal orb',
    'chis'    : 'cartographer\'s chisel',
    'bless'   : 'blessed orb',
    'alc'     : 'orb of alchemy',
    'silver'  : 'silver coin',
    'jew'     : 'jeweller\'s orb',
    'chance'  : 'orb of chance',
    'chrom'   : 'chromatic orb',
    'bauble'  : 'glassblower\'s bauble',
    'alt'     : 'orb of alteration',
    'trans'   : 'orb of transmutation',
    'aug'     : 'orb of augmentation',
    'whet'    : 'blacksmith\'s whetstone',
    'portal'  : 'portal scroll',
    'wisdom'  : 'scroll of wisdom',
    'scrap'   : 'armourer\'s scrap'

  };

let cache = {
  currency: {},
  activeLeague: '',
  leagueCache: {},
  items: []
};

function getLineEntry(key, lines) {
    return lines.find(obj => obj.currencyTypeName.toLowerCase() === CURRENCY_CHART[key]);
}

function fetchCurrencies(league) {
    const date = new Date();

    if (league.length > 0) {
      fetch(`http://poe.ninja/api/Data/GetCurrencyOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
        .then(currency => currency.json())
        .then(currencyJSON => {
          cache.currency = currencyJSON;
        })
        .catch(console.log);
    }
}

function fetchUniques(league) {
  const date = new Date();
  Promise.all([
    fetch(`http://poe.ninja/api/Data/GetUniqueArmourOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`),
    fetch(`http://poe.ninja/api/Data/GetUniqueMapOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`),
    fetch(`http://poe.ninja/api/Data/GetUniqueFlaskOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`),
    fetch(`http://poe.ninja/api/Data/GetUniqueWeaponOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`),
    fetch(`http://poe.ninja/api/Data/GetUniqueAccessoryOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`),
    fetch(`http://poe.ninja/api/Data/GetUniqueJewelOverview?league=${league}&date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
  ])
    .then(([a, b, c, d, e, f]) => {
      return Promise.all([a.json(), b.json(), c.json(), d.json(), e.json(), f.json()]);
    })
    .then(([a, b, c, d, e, f]) => cache.items = Array.prototype.concat(a.lines, b.lines, c.lines, d.lines, e.lines, f.lines));
}

function findRelevantLeague(leagues) {
  const LEAGUE = leagues.find(league => league.id.indexOf('Hardcore ') > -1);

  cache.leagueCache = LEAGUE;

  if (LEAGUE.id !== cache.activeLeague) {
    client.channels.find('id', '282944749693042698').send(`New league: ${LEAGUE.id}`);
  }
  return LEAGUE.id;
}

function fetchLeagues() {
  return fetch('http://api.pathofexile.com/leagues?type=main&compact=1')
          .then(res => res.json())
          .then(leagues => {
            cache.activeLeague = findRelevantLeague(leagues);
          })
}

function getItemByName(name) {
  return cache.items.find(item => item.name.toLowerCase() === name);
}

client.on('ready', () => {
  fetchLeagues()
    .then(() => {

      fetchCurrencies(cache.activeLeague);
      fetchUniques(cache.activeLeague);

      setInterval(fetchLeagues, 3600000);
      setInterval(fetchUniques, 3600000)

      setInterval(function() {
        fetchCurrencies(cache.activeLeague)
      }, 3600000);

    });
});

client.on('message', async message => {
  if (message.author.bot) return;

  if (message.content.indexOf(config.prefix) !== 0) return;

  if (message.content.split(' ').length > 10) return;

  const fullMsg = message.content.slice(config.prefix.length),
        args = message.content.slice(config.prefix.length).trim().split(/ +/g),
        command = args[0].toLowerCase();

  if (command === 'help') {
    message.channel.send(`
\`\`\`
Currencies: ${Object.keys(CURRENCY_CHART).toString().split(',').join(', ')}

Commands:

+ex           to get chaos equivalent
+ex mirror    gets exchange rate 
+wanderlust   gets the current price for the item
\`\`\`
    `);
  }

  if (command === 'league') {
    message.channel.send(`Current league: ${cache.activeLeague}`);
  }

  if (args.length === 2 && Object.keys(CURRENCY_CHART).indexOf(args[0]) > -1 && Object.keys(CURRENCY_CHART).indexOf(args[1]) > -1) {
    const firstCurrency = getLineEntry(args[0], cache.currency.lines),
          secondCurrency = getLineEntry(args[1], cache.currency.lines);

    message.channel.send(`${(secondCurrency.chaosEquivalent / firstCurrency.chaosEquivalent).toFixed(2)} ${CURRENCY_CHART[args[0]]}s for one ${CURRENCY_CHART[args[1]]} in ${cache.activeLeague}`);
    return;
  }


  if (args.length === 1 && Object.keys(CURRENCY_CHART).indexOf(args[0]) > -1) {
    const RESULT = getLineEntry(args[0], cache.currency.lines);
    if (RESULT.chaosEquivalent > 1) {
      message.channel.send(`${(RESULT.chaosEquivalent).toFixed(2)} chaos for one ${CURRENCY_CHART[args[0]]} in ${cache.activeLeague}`);
    } else {
      message.channel.send(`${(1 / RESULT.chaosEquivalent).toFixed(2)} ${CURRENCY_CHART[args[0]]} for one chaos in ${cache.activeLeague}`);
    }
    return;
  }

  if (getItemByName(fullMsg)) {
    const ITEM = getItemByName(fullMsg);
    message.channel.send(`${ITEM.chaosValue}c to buy ${ITEM.name} in ${cache.activeLeague}`)
    return;
  }

});

client.login(config.token).catch(console.log);