require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField
} = require('discord.js');

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const adapter = new JSONFile('./bot/db.json');

const db = new Low(adapter, {
  users: [],
  codes: []
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [

  new SlashCommandBuilder()
    .setName('earn')
    .setDescription('Gagner des points'),

  new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem une clé')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('La clé')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Voir ses points'),

  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Voir la boutique'),

  new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Ajouter des points')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Nombre de points')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('deletepoints')
    .setDescription('Supprimer des points')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Nombre de points')
        .setRequired(true)
    )

].map(command => command.toJSON());

const rest = new REST({ version: '10' })
  .setToken(process.env.TOKEN);

(async () => {

  try {

    console.log('Chargement des commandes...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('Commandes enregistrées.');

  } catch (error) {

    console.error(error);

  }

})();

client.once('ready', async () => {

  await db.read();

  console.log(`Bot connecté : ${client.user.tag}`);

});

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  await db.read();

  let user = db.data.users.find(
    u => u.id === interaction.user.id
  );

  if (!user) {

    user = {
      id: interaction.user.id,
      points: 0
    };

    db.data.users.push(user);

  }

  // /earn

  if (interaction.commandName === 'earn') {

    await interaction.reply({
      content:
        'Regarde une pub ici : http://localhost:3000/watch.html',
      ephemeral: true
    });

  }

  // /balance

  if (interaction.commandName === 'balance') {

    await interaction.reply({
      content:
        `💰 Tu as ${user.points} points.`
    });

  }

  // /shop

  if (interaction.commandName === 'shop') {

    await interaction.reply({
      content:
`🛒 Boutique

5 pts = Conseil
10 pts = Analyse vidéo
20 pts = Session Discord`
    });

  }

  // /redeem

  if (interaction.commandName === 'redeem') {

    const codeInput =
      interaction.options.getString('code');

    const code = db.data.codes.find(
      c => c.code === codeInput
    );

    if (!code) {

      return interaction.reply({
        content: '❌ Code invalide.',
        ephemeral: true
      });

    }

    if (code.used) {

      return interaction.reply({
        content: '❌ Code déjà utilisé.',
        ephemeral: true
      });

    }

    code.used = true;

    user.points += 1;

    await db.write();

    await interaction.reply({
      content:
        '✅ +1 point ajouté.'
    });

  }

  // /addpoints

  if (interaction.commandName === 'addpoints') {

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {

      return interaction.reply({
        content:
          '❌ Tu dois être administrateur.',
        ephemeral: true
      });

    }

    const target =
      interaction.options.getUser('user');

    const amount =
      interaction.options.getInteger('amount');

    let targetUser =
      db.data.users.find(
        u => u.id === target.id
      );

    if (!targetUser) {

      targetUser = {
        id: target.id,
        points: 0
      };

      db.data.users.push(targetUser);

    }

    targetUser.points += amount;

    await db.write();

    await interaction.reply({
      content:
        `✅ ${amount} points ajoutés à ${target.username}.`
    });

  }

  // /deletepoints

  if (interaction.commandName === 'deletepoints') {

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {

      return interaction.reply({
        content:
          '❌ Tu dois être administrateur.',
        ephemeral: true
      });

    }

    const target =
      interaction.options.getUser('user');

    const amount =
      interaction.options.getInteger('amount');

    let targetUser =
      db.data.users.find(
        u => u.id === target.id
      );

    if (!targetUser) {

      return interaction.reply({
        content:
          '❌ Cet utilisateur n’a pas de données.'
      });

    }

    targetUser.points -= amount;

    if (targetUser.points < 0) {
      targetUser.points = 0;
    }

    await db.write();

    await interaction.reply({
      content:
        `✅ ${amount} points retirés à ${target.username}.`
    });

  }

});

client.login(process.env.TOKEN);