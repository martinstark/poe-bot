'use strict';

const Discord = require('discord.js'),
  client = new Discord.Client(),
  config = require('./config.json'),
  fetch = require('node-fetch');

let state = {};

function fetchCurrencies() {

    fetch('http://poe.ninja/api/Data/GetCurrencyOverview?league=Harbinger&date=2017-11-29')
      .then((currency) => {
        return currency.json();
      })
      .then((currencyJSON) => {
        state = currencyJSON;
      })
      .catch(console.log);
}

client.on('ready', () => {
});

client.on('message', async message => {
  if (message.author.bot) return;

  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    message.channel.send(
      '```Commands:\n\n' +
      '+help\n```');
  }

  if (command === 'ex') {
    message.channel.send(`${state.lines[0].currencyTypeName}`);
  }

  message.channel.send();

});

client.login(config.token).catch(console.log);