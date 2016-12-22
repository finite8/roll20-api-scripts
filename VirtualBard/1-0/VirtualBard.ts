/// <reference path="..\Roll20typedef.d.ts" />
var vb = (function ()
{
      var sexTypes = expand({
          "m,male" : "Male",
          "f,female" : "Female"
      });
      var classTypes = expand({
          "fighter" : "Fighter",
          "barb,barbarian" : "Barbarian",
          "bard" : "Bard",
          "cleric": "Cleric",
          "druid,hippie":"Druid",
          "monk":"Monk",
          "paladin":"Paladin",
          "ranger":"Ranger",
          "rogue,thief":"Rogue",
          "sorcerer,sorc":"Sorcerer",
          "wizard,wiz":"Wizard",
          "warlock,lock":"Warlock"
      });
      var messageTypes = {
        test : "test",
        character   : "Character Event"
      };
      var VBAttributes = {
          IsMet : "VB-IsMet"
      }
     

      function testCode()
      {
          var myString = "balls balls and balls and stuff<test id=\"1\" others=\"5\">someother <innerTest></innerTest></test>";
          var r = findTag(myString, "test", {id:"1"});
          log(r);
          log(r.appendText("[Appended]").prependText("[Prepended]").findTag("innerTest").setText("[SetText]").getText());
      }
     

    // returns a object that describes the results. The returned object supports additional searcing and text modification functions.
   function findTag(baseText, tag, attributes, basis)
    {
        
        var regString = "(<" + tag + "(\\b[^>]*)>)([\\s\\S]*?)(<\\\/" + tag + ">)";
        
        var r = new RegExp(regString, "gim");
        var match = r.exec(baseText);
        
        if (match == null)
        {
            log("no match");
            return null;
        }

        if (isAssigned(attributes))
        {
            
            // lets go through each property pair.
            for (var p in attributes)
            {
                if (attributes.hasOwnProperty(p))
                {
                    var attribReg = new RegExp(p + "=\"" + attributes[p] + "\"");
                    if (attribReg.exec(match[2]) == null)
                    {
                        log("missing attribute");
                    }
                }
            }
        }

        // if we have gotten this far, we have a positive match. lets keep going.
        var offset;
        var useOriginalText;
        if (isAssigned(basis))
        {
            offset = basis.innerStartIndex;
            useOriginalText = basis.originalText;
        }
        else
        {
            offset = 0;
            useOriginalText = { value : baseText };
        }
        
        var result = {
            originalText : useOriginalText,
            tagAttributes : match[2],
            tag : tag,
            endTag : match[4],
            text : match[3],
            startIndex : match.index + offset,
            innerStartIndex : match.index + match[1].length + offset,
            innerEndIndex : (match.index + match[0].length - match[4].length) + offset,
            endIndex : match.index + match[0].length + offset,
            getText : function () {return this.originalText.value;},
            findTag : function(subTag, subAttributes) {
                return findTag(result.text, subTag, subAttributes, result);
            },
            appendText : function(textToAppend) {
                var txtToModify = this.originalText.value;
                this.originalText.value = txtToModify.slice(0, this.innerEndIndex) + textToAppend + txtToModify.slice(this.innerEndIndex)
                this.innerEndIndex += textToAppend.length;
                this.endIndex = this.innerEndIndex + endTag.length;
                this.text = this.originalText.value.substring(this.innerStartIndex, this.innerEndIndex);
                return result;
            },
            setText : function(textToSet) {
                var txtToModify = this.originalText.value;
                this.originalText.value = txtToModify.slice(0, this.innerStartIndex) + textToSet + txtToModify.slice(this.innerEndIndex)
                this.innerEndIndex = this.innerStartIndex + textToSet.length;
                this.endIndex = this.innerEndIndex + endTag.length;
                this.text = this.originalText.value.substring(this.innerStartIndex, this.innerEndIndex);
                return result;
            },
            prependText : function(textToPrepend) {
                var txtToModify = this.originalText.value;
                this.originalText.value = txtToModify.slice(0, this.innerStartIndex) + textToPrepend + txtToModify.slice(this.innerStartIndex)
                this.innerEndIndex += textToPrepend.length;
                this.endIndex = this.innerEndIndex + endTag.length;
                this.text = this.originalText.value.substring(this.innerStartIndex, this.innerEndIndex);
                return result;
            }
        };
        log(result);
        return result;

    }

      function isDefined(obj)
      {
          return typeof obj !== 'undefined';
      }
      function isAssigned(obj)
      {
          return obj != null && typeof obj !== 'undefined';
      }
      function assertVariableAssigned(obj, varName)
      {
          if (!isAssigned(obj))
          {
              if (obj == null)
              {
                  throw varName + " cannot be NULL";
              }
              else if (typeof obj == 'undefined')
              {
                  throw varName + " was not defined";
              }
              else
              {
                  throw varName + " was invalid";
              }
          }
      }
      function isAnyDefined()
      {
          for (var i = 0; i < arguments.length; i++)
          {
              if (isDefined(arguments[i]))
              {
                  return true;
              }
          }
          return false;
      }
      function expand(obj) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; ++i) {
                var key = keys[i],
                    subkeys = key.split(/,\s?/),
                    target = obj[key];
                delete obj[key];
                subkeys.forEach(function(key) { obj[key] = target; })
            }
            return obj;
        }
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
                else if (msg.content.indexOf("!test") == 0)
                {
                    result.Type = messageTypes.test;
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
                var postAction;
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
                        postAction = function (ctx) {p_characterFunctions.logResults(ctx)};
                    }
                }
                else if (data.Type == messageTypes.test)
                {
                    testCode();
                }
                else
                {
                    throw "Command not implemented";
                }
                if (typeof processingFunction !== 'undefined')
                {
                    var errors = [];
                    for (i = 0; i < data.Commands.length; i++)
                    {
                        try
                        {
                            var cmd = data.Commands[i];
                            processingFunction(context, cmd); 
                        }
                        catch (err)
                        {
                            errors.push("cmd=(" + cmd.Type + " " + cmd.Params.join(" ") + "), err=" + err.message);
                        }
                    }
                    if (isDefined(postAction))
                    {
                        postAction(context);
                    }
                    if (errors.length > 0)
                    {
                        throw "Following errors were encountered:\r\n" + errors.join("\r\n");
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
                else if (cmd.Type == "-who")
                {
                    p_characterFunctions.whoAction(ctx, cmd);
                }
                else if (cmd.Type == "-r")
                {
                    p_characterFunctions.raceAction(ctx, cmd);
                }
                else if (cmd.Type == "-s")
                {
                     p_characterFunctions.sexAction(ctx, cmd);
                }
                else if (cmd.Type == "-c")
                {
                    p_characterFunctions.classAction(ctx, cmd);
                }
                else
                {
                    throw "Character command not recognized: " + cmd.Type;
                }
            }
      var p_characterFunctions = {
          logResults: function (context) {
              var sp = context.Current.SentenceParts;
              if (isDefined(sp) && isDefined(sp.Name))
              {
                  var sent = "";
                  sent = sent + "The party met [" + sp.Name + "]";
                  if (isAnyDefined(sp.Race, sp.Sex, sp.Class))
                  {
                      sent = sent + ", a";
                      if (isDefined(sp.Sex))
                      {
                          sent = sent + " " + sp.Sex;
                      }
                      if (isDefined(sp.Race))
                      {
                          sent = sent + " " + sp.Race;
                      }
                      if (isDefined(sp.Class))
                      {
                          sent = sent + " " + sp.Class;
                      }
                  }
                  sent = sent + ".";
                  p_journalFunctions.appendJournalLine(sent);
              }
          },
          appendBio : function (char, text) {

          },
          whoAction : function (ctx, cmd) {
              var charName = cmd.Params.join(" ");
              var r = p_sysFunctions.findCharacterSheet(charName);
              if (isDefined(r))
              {
                  // we have the character
                  ctx.CurrentChar = r;
                  ctx.SendChat("Character context set to: " + r.name);
              }
              else
              {
                  ctx.SendChat("No character exists with name: " + charName);
              }
          },
          classAction: function (ctx, cmd) {
              this.assertCurrentCharDefined(ctx, cmd);
              var realClass = classTypes[cmd.Params[0].toLowerCase()];
              if (!isDefined(realClass))
              {
                  ctx.SendChat("Class " + cmd.Params[0] + " could not be resolved to a real class. Character sheet will resort to a default instead");
                  ctx.Current.SentenceParts.Class = cmd.Params[0];
                  realClass = "";
              }
              else
              {
                  ctx.Current.SentenceParts.Class = realClass;
              }
              p_sysFunctions.setCharacterAttribute(ctx.CurrentChar, "class", realClass);
              p_sysFunctions.setCharacterAttribute(ctx.CurrentChar, "inputClass", cmd.Params[0]);
          },
        metAction: function (ctx, cmd) {
            var charName = cmd.Params.join(" ");
            var r = p_sysFunctions.getCharacterSheet(charName);
            log("Char Info: " + r);
            if (!r.IsNew)
            {
                sendMessage(ctx.UserName, "The party is already aware of " + charName);
            }
            else
            {
                //broadcastMessage("The party met " + charName);
                //ctx.Current.SentenceParts.Name = charName;
            }
            ctx.Current.SentenceParts.Name = charName;
            ctx.CurrentChar = r.Char;

        },

        sexAction: function (ctx, cmd) {
            this.assertCurrentCharDefined(ctx, cmd);
            var sex = this.parseSex(cmd.Params[0]);
            ctx.Current.SentenceParts.Sex = sex;
            p_sysFunctions.setCharacterAttribute(ctx.CurrentChar, "sex", sex);
        },

        raceAction: function (ctx, cmd) {
            this.assertCurrentCharDefined(ctx, cmd);
            ctx.Current.SentenceParts.Race = cmd.Params.join(" ");
            p_sysFunctions.setCharacterAttribute(ctx.CurrentChar, "race", ctx.Current.SentenceParts.Race);
        }
        , parseSex : function(text)
        {
            var sex = sexTypes[text.toLowerCase()];
            if (typeof sex == 'undefined')
            {
                throw text + " could not be interpreted as a valid sex";
            }
            return sex;
        }
        , assertCurrentCharDefined: function(ctx, cmd) {
            if (typeof ctx.CurrentChar == 'undefined')
            {
                throw cmd.Type + " requires a Character context to be set";
            }
        }


      };

      var p_journalFunctions = {
            currentSentence : "",
            appendJournalText : function (text) {
                this.currentSentence = this.currentSentence + text;
                var j = this.getJournalHandout();
                j.get("notes", function (n) {
                    log("Existing Notes:" + n);
                    setTimeout(function () {
                        j.set("notes", n + text);
                    }, 100);
                    
                });
                
                //j.notes = (j.notes || "") + text;
                log("Writting to log:" + text);
            },
            appendJournalLine : function (text) {
                
                this.appendJournalText(text + "<br>");
                this.finishSentence();
            },
            finishSentence : function ()
            {
                if (this.currentSentence !== "")
                {
                    broadcastMessage(this.currentSentence);
                    this.currentSentence = "";
                }
            },


            getJournalHandout : function () {
                if (typeof this.journalHandout !== 'undefined')
                {
                    return this.journalHandout;
                }
                var handouts = findObjs({_type:"handout", name: "Adventure Log"});
                if (handouts.length == 0)
                {
                    var h = createObj("handout", {name: "Adventure Log", inplayerjournals:"all", controlledby:"all", notes: ""});
                    this.journalHandout = h;
                }
                else
                {
                    createObj("something", {name: "something",  });
                    log("found existing");
                    this.journalHandout = handouts[0];
                }
                this.appendJournalLine(new Date(Date.now()).toLocaleString());
                return this.journalHandout;
            }
      };

      var p_sysFunctions = {
          
          getSafeCharacterName : function (charName) {
                return "_vb_c:" + charName;
          },
          findCharacterSheet : function (charName) {
              var shts = findObjs({_type:"character", name: charName});
              log(shts);
              if (shts.length == 0)
              {
                  return null;
              }
              else
              {
                  return shts[0];
              }
          },

          getCharacterSheet : function (charName) {
                var char = this.findCharacterSheet(charName);
                log("Result:" + char);
                var isNew;
                if (char !== null)
                {
                    // the NPC sheet might have been created ahead of time. Double check this to be sure.
                    isNew = !(this.getCharacterAttribute(char, VBAttributes.IsMet) == true);
                    

                    
                }
                else
                {
                    
                    char = createObj<Character>("character", {name: charName, inplayerjournals:"all", controlledby:"all"});
                    this.setCharacterAttribute(char, VBAttributes.IsMet, true);
                    isNew = true;
                }
                
                
                
                log(char);
                return {IsNew : isNew, Char: char};
          },
        getCharacterAttribute: function (char, attribName)
        {
            assertVariableAssigned(char, "char");
            if (!isDefined(char.id))
            {
                log(char);
                throw "id was undefined on char parameter";
            }
            var result = getAttrByName(char.id, attribName);
            return result;

        },
        setCharacterAttribute: function (char, attribName, newValue)
        {

            var attribs = findObjs({_type:"attribute", _characterid:char.id,name:attribName});
            log("setting attribute");
            log(char);
            //log(findObjs({_type:"attribute", _characterid:char.id}));
            if (attribs.length == 0)
            {
                // we instead need to insert it
                var newAttrib = createObj<Attribute>("attribute", {name: attribName, current: newValue, characterid:char.id});
                log("Inserting attribute" + attribName);
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
                //try
                //{
                    var r = parseMessage(msg);
                    if (r.IsValid)
                    {
                        var ctx = getUserContext(msg);
                        // we have a command and a context to work with. lets start processing.
                        process(ctx, r);
                    }
                //}
                //catch (err)
                //{
                //    log(err);
                //    ctx.SendChat("Invalid command: " + err.message);
                //}
            });
}());

