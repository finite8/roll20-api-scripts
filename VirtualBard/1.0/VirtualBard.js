
var vb = (function ()
{
      var messageTypes = {
        character   : "Character Event"
      };
            function parseMessage(msg)
            {
                var result = {};
                if (msg.type != "api")
                {
                    result.IsValid = false;
                    return result;
                }
                result.IsHelp = false;
                if (msg.content.indexOf("!h") == 0)
                {
                    result.IsHelp = true;
                    result.Type = "All";
                }
                else if (msg.content.indexOf("!c") == 0)
                {
                    result.Type = messageTypes.character;
                }
                else
                {
                    result.IsValud = false;
                    return result;
                }
                result.IsValid = true;
                result.UserContextId = msg.playerid;
                result.UserName = msg.who;
                var cmd = {Type:"", Params:[]};
                result.Commands = [];
                // we now search for the next '-' starting element.
                var parts = msg.content.trim().split(" ");
                var index;
                if (parts.length >= 2 && parts[1] == "-h")
                {
                    result.IsHelp = true;
                    index = 2;
                }
                else
                {
                    index = 1;
                }
                var addedSomething = false;
                for (i = index; i < parts.length; i++)
                {
                    var part = parts[i];
                    if (part.indexOf("-") == 0)
                    {
                        // we have a command initiator
                        if (addedSomething)
                        {
                            result.Commands.push(cmd);
                            cmd = {Type:part, Params:[]};
                            addedSomething = false;
                        }
                        else
                        {
                            cmd.Type = part;
                        }
                    }
                    else
                    {
                        cmd.Params.push(part);
                        addedSomething = true;
                    }
                }
                if (addedSomething)
                {
                    result.Commands.push(cmd);
                }
                
                
                log(result);
                return result;
            }
            
            function processAction(user, data)
            {
                
                
            }
            
            function sendMessage(user, message)
            {
                sendChat("Virtual Bard", "/w " + user + " " + message);
            }

            function broadcastMessage(message)
            {
                sendChat("Virtual Bard", message);
            }
            
            function getUserContext(msg)
            {
                var ctx = contextStore[msg.playerid];
                
                if (typeof ctx == 'undefined')
                {
                    ctx = {
                              PlayerId  :   msg.playerid
                            , UserName  :   msg.who
                            , SendChat : function (text) {
                                sendMessage(msg.who, text);
                            }
                        };
                    contextStore[msg.playerid] = ctx;
                }
                return ctx;
            }
            function printRootHelp(data)
            {
                
            }
            function process(context, data)
            {
                context.Current = {};
                var processingFunction;
                if (data.Type == messageTypes.character)
                {
                    if (data.IsHelp)
                    {
                        printJournalHelp(data);
                    }
                    else
                    {
                        context.Current.SentenceParts = {};
                        processingFunction = function (ctx, cmd) {processCharacterAction(ctx, cmd)};  
                    }
                }
                else
                {
                    throw "Command not implemented";
                }
                if (typeof processingFunction !== 'undefined')
                {
                    for (i = 0; i < data.Commands.length; i++)
                    {
                        var cmd = data.Commands[i];
                        processCharacterAction(context, cmd); 
                    }
                }
                
            }
            function printJournalHelp(data)
            {
                sendMessage(data.UserName, "!j +met <name> --- Adds a new event for meeting a person. Creates a new person entry switches context to them")
            }
            function processCharacterAction(ctx, cmd)
            {
                if (cmd.Type == "-met")
                {
                    p_characterFunctions.metAction(ctx, cmd);
                }
                else if (cmd.Type == "-r")
                {
                    p_characterFunctions.raceAction(ctx, cmd);
                }
                else
                {
                    throw "Character command not recognized: " + cmd.Type;
                }
            }
      var p_characterFunctions = {

        metAction: function (ctx, cmd) {
            var charName = cmd.Params.join(" ");
            var r = p_sysFunctions.getCharacterSheet(charName);
            log(r);
            if (!r.IsNew)
            {
                sendMessage(ctx.UserName, "The party is already aware of " + charName);
            }
            else
            {
                broadcastMessage("The party met " + charName);
                ctx.Current.SentenceParts.Name = charName;
            }
            ctx.CurrentChar = r.Char;

        },

        raceAction: function (ctx, cmd) {
            this.assertCurrentCharDefined(ctx, cmd);
            ctx.Current.SentenceParts.Race = cmd.Params.join(" ");
            p_sysFunctions.setCharacterAttribute(ctx.CurrentChar, "race", ctx.Current.SentenceParts.Race);
        }
        , assertCurrentCharDefined: function(ctx, cmd) {
            if (typeof ctx.CurrentChar == 'undefined')
            {
                throw cmd.Type + " requires a Character context to be set";
            }
        }


      };

      var p_sysFunctions = {
          getSafeCharacterName : function (charName) {
                return "_vb_c:" + charName;
          },
          getCharacterSheet : function (charName) {
                var shts1 = findObjs({_type:"character", name: charName});
                //var shts2 = findObjs({_type:"character", name: p_sysFunctions.getSafeCharacterName(charName)});
                var shts = shts1;//.concat(shts2);
                var h;
                log(shts);
                var isNew;
                if (shts.length != 0)
                {
                    h = shts[0];
                    isNew = false;
                }
                else
                {
                    h = createObj("character", {name: charName});
                    isNew = true;
                }
                
                
                
                log(h);
                log(getAttrByName(h.id, "race"));
                return {IsNew : isNew, Char: h};
          },
        setCharacterAttribute: function (char, attribName, newValue)
        {

            var attribs = findObjs({_type:"attribute", _characterid:char.id,name:attribName});
            //log("setting attribute");
            //log(char);
            //log(findObjs({_type:"attribute", _characterid:char.id}));
            if (attribs.length == 0)
            {
                // we instead need to insert it
                var newAttrib = createObj("attribute", {name: attribName, current: newValue, characterid:char.id});
            }
            else if (attribs.length > 1)
            {
                throw attribs.length + " attributes discovered with name " + attribName;
            }
            else
            {
                attribs[0].current = newValue;
            }
        }
      };
            
      var contextStore = {};
            
            on("chat:message", function (msg) {
                log(msg);
                var r = parseMessage(msg);
                if (r.IsValid)
                {
                    var ctx = getUserContext(msg);
                    // we have a command and a context to work with. lets start processing.
                    process(ctx, r);
                }
            });
}());

