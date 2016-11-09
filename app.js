var builder = require('botbuilder');
var restify = require('restify');
var Client = require('node-rest-client').Client;
var dotenv = require('dotenv');
// var model = process.env.LUIS_MODEL;
// var recogonizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog();

dotenv.load();


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD

});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/',dialog);

dialog.matches(/^showPublishers/,[
    function(session){
        session.beginDialog("/showpublishers");
    }
]);
dialog.matches(/^what Can you Do/i,[
    function(session){
        session.send("I can fetch the top article from a provider you specify!");
    }
]);
bot.dialog('/showpublishers',[
    function(session){
        session.endDialog("I can Bring You news ! \nThese are some worth Trying !\n the-Hindu,the-verge,techcruch,bbc-bews,cnn,cnbc,boolmberg,espn,espn-cric-info,google-news,the-times-of-india,time")    
    }
    
]);
dialog.onDefault([
    function (session) {
        builder.Prompts.text(session, 'Which Publisher ? ');
    },
    function (session,results) {
        var source = results.response;
        var client = new Client();
        var session = session;
        session.send("Showing Top Articles in %s",source);
        client.get("api.github.com/search/users?q="+source
                    , 
                    function (data, response) {
                     // parsed response body as js object 
                    var msg = new builder.Message(session)
                        .textFormat(builder.TextFormat.xml)
                        .attachments([
                            new builder.HeroCard(session)
                                .title(data.items[0].login)
                                .text(data.items[0].url)
                                .images([
                                    builder.CardImage.create(session, data.items[0].avatar_url)
                                ])
                                .tap(builder.CardAction.openUrl(session, data.items[0].html_url))
                        ]);
                    session.endDialog(msg);

                             
        });
        
    }

]);

