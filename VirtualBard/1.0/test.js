// var tag = "test";
// var reg = "<" + tag + "(\\b[^>]*)>([\\s\\S]*?)<\\\/" + tag + ">";
// console.log(reg);
// var r = new RegExp(reg, "gm");

// var myString = "<test id=\"1\">someother</test>";
// //var myRegexp = /(?:^|\s)format_(.*?)(?:\s|$)/g;
// //var match = myRegexp.exec(myString);
// var match = r.exec(myString);
// console.log(match); // abc

function testCode()
      {
          var myString = "balls balls and balls and stuff<test id=\"1\" others=\"5\">someother <innerTest></innerTest></test>";
          var r = findTag(myString, "test", {id:"1"});
          log(r);
          log(r.appendText("[Appended]").prependText("[Prepended]").findTag("innerTest").setText("[SetText]").getText());
      }
      // searches for the specified tag in the base text, and appends the desired content.
    function appendTaggedText(baseText, tag, textToAppend)
    {

    }
    function log(text)
    {
        console.log(text);
    }
    function isDefined(obj)
      {
          return typeof obj !== 'undefined';
      }
      function isAssigned(obj)
      {
          return obj != null && typeof obj !== 'undefined';
      }
    // returns a object that describes the results
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
                this.text = this.originalText.value.substring(this.innerStartIndex, this.innerEndIndex);
                return result;
            },
            setText : function(textToSet) {
                var txtToModify = this.originalText.value;
                this.originalText.value = txtToModify.slice(0, this.innerStartIndex) + textToSet + txtToModify.slice(this.innerEndIndex)
                this.innerEndIndex = this.innerStartIndex + textToSet.length
                this.text = this.originalText.value.substring(this.innerStartIndex, this.innerEndIndex);
                return result;
            },
            prependText : function(textToPrepend) {
                var txtToModify = this.originalText.value;
                this.originalText.value = txtToModify.slice(0, this.innerStartIndex) + textToPrepend + txtToModify.slice(this.innerStartIndex)
                this.innerEndIndex += textToPrepend.length;
                this.text = this.originalText.value.substring(this.innerStartIndex, this.innerEndIndex);
                return result;
            }
        };
        log(result);
        return result;

    }
testCode();