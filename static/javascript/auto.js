/*  Copyright (C) 2012 by mountainpenguin (pinguino.de.montana@googlemail.com)
 *  http://github.com/mountainpenguin/pyrt
 *
 *  This file is part of pyRT.
 *  
 *  pyRT is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  pyRT is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with pyRT.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

var args = null;
var socket = null;

if (window.document.location.protocol == "https:") {
     var socket_protocol = "wss"
} else {
     var socket_protocol = "ws"
}

$(document).ready( function () {
    socket = new window.WebSocket(socket_protocol + "://" + window.document.location.host + "/autosocket");
    socket.onmessage = OnMessage;
    socket.onerror = function (evt) {
        console.log("autoSocket error", evt, socket);
    }
    socket.onopen = function (evt) {
        console.log("autoSocket opened", evt, socket);
        runSocketInit();
    }
    socket.onclose = function (evt) {
        console.log("autoSocket closed", evt, socket);
    }
    $(".bot_button").live("click", function () {
        if ($(this).attr("id").indexOf("start_") !== -1) {
            var name = $(this).attr("id").split("start_")[1];
            socket.send("request=start_bot&arguments=" + name);
        } else {
            var name = $(this).attr("id").split("stop_")[1];
            socket.send("request=stop_bot&arguments=" + name);
        }
    });
    $(".add_filter_button").live("click", function () {
        var inputval = $(this).parent().next().val();
        var name = $(this).closest(".remote_setting").attr("id").split("remote_settings_")[1];
        if (inputval) {
            socket.send("request=add_filter&name=" + name + "&restring=" + inputval);
        }
    });
    $(".filter").live("click", function () {
        var name = $(this).closest(".remote_setting").attr("id").split("remote_settings_")[1];
        var index = $(".filter", $(this).parent()).index($(this));
        var c = confirm("Are you sure you want to remove this filter?");
        if (c) {
            socket.send("request=remove_filter&name=" + name + "&index=" + index);
        }
    });
    console.log($("#dialog_form"));
    $("#dialog_form").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Submit": function () {
                var pw=$("#password").val();
                // encrypt password by normal method (secure from MITM attacks
                // due to the time-based OTP nature [?] )
                var hashed = hashPassword(pw);

//                args.salt = salt;
//                var hash = hashed.split("$")[2];
                // use hash to encrypt message using AES encryption
//                for (i=0; i<args.tocrypt.length; i++) {
//                    var encrypted = CryptoJS.AES.encrypt(args.tocrypt[i][1], hash, {iv: salt, mode: CryptoJS.mode.CFB});
//                    console.log("iv: " + salt + " " + encrypted.iv);
//                    console.log("key: " + hash + " " + encrypted.key);
//                    console.log("encrypted: " + encrypted.ciphertext);
                
                // decrypting with PyCrypto is too complicated to sort out, so
                // send plaintext for now
                
                args.auth = hashed;
                var q_ = []
                $.each(args, function(key, value) {
                    q_.push(key + "=" + encodeURIComponent(value));
                });
                var query = q_.join("&");
                socket.send(query);
                $(this).dialog("close");
            },
            "Cancel": function() { 
                $(this).dialog("close");
            }
        },
        close: function () {
            $("#password").val("");
            args = null;
        }
    });

    $(".remote_row").live("click", function (evt) {
        var next_row = $(this).next();
        if (next_row.hasClass("is_hidden")) {
            next_row.removeClass("is_hidden");
        } else {
            next_row.addClass("is_hidden");
        }
    });
    $("input").live("keydown", function (evt) {
        $(this).prev().css({color:"", "font-weight":"", "font-style":""});
    });
    $(".submit_button").live("click", function (evt) {
        // get arguments
        var inputs = $("input", $(this).parent().parent());
        args = new Object();
        args.tocrypt = [];
        var exit = false;
        inputs.each( function (elem) {
            var key = $(this).attr("name");
            var value = $(this).attr("value");
            if (!value) {
                $(this).prev().css({color: "red", "font-weight": "bold", "font-style": "italic"});
                exit = true;
            } else {
//                args.tocrypt.push( new Array(key, value) );
                args[key] = value
            }
        });
        if (exit) {
            return false;
        } else {
            args.request = "set_source";
            // set args name value for assignment on other side
            args.name = $(this).attr("id").split("submit_")[1];
            $("#dialog_form").dialog("open");
        }
    });
});

function runSocketInit() {
    socket.send("request=get_sources")
}

function OnMessage (evt) {
     if (evt.data.indexOf("ERROR") === 0) {
        console.log(evt.data);
     } else {
          var response = JSON.parse(evt.data);
          if (response.request == "get_sources") {
               var load = $("div#available").remove();
               var tab = $("table#available > tbody");
               for (i=0; i<response.response.length; i++) {
                    tab.append($(response.response[i].row));
                    tab.append($(response.response[i].req_row));
               }
          } else if (response.request == "get_source_single") {
            refresh_drop_down_respond(response.response);
          } else if (response.request == "add_filter") {
            refresh_drop_down(response.response);
          } else if (response.request == "start_bot") {
            setTimeout(function () { refresh_drop_down(response.response); }, 2000);
          } else if (response.request == "stop_bot") {
            refresh_drop_down(response.response);
          } else if (response.request == "remove_filter") {
            refresh_drop_down(response.response);
          } else if (response.request == "set_source") {
            refresh_drop_down(response.response);
          } else {
            console.log("socket message:", evt.data)
          }
     }
}

function select_tab(elem) {
    elem.style.backgroundColor = "#bbbbbb";
}

function deselect_tab(elem) {
    elem.style.backgroundColor = null;
}

function navigate_tab(elem) {
    window.location.replace(window.location);
}

function navigate_tab_toHome(elem) {
    window.location = "/?view=" + elem.id.split("tab_")[1];
}

function refresh_drop_down(name) {
    // get drop down
    socket.send("request=get_source_single&arguments=" + name);
}
function refresh_drop_down_respond(data) {
    var row = $(data.req_row);
    var name = row.attr("id").split("remote_settings_")[1];
    var started = $(".bot_button", row).attr("id");
    if (started.indexOf("start_") == 0) {
        $(".status-" + name).html("off").removeClass("status-on").addClass("status-off");
    } else {
        $(".status-" + name).html("on").removeClass("status-off").addClass("status-on");
    }
    $("#remote_settings_" + name).html(
        row.html()
    );
}