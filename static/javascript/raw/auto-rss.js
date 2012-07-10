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

$(document).ready( function() {
    $("#add_feed").click( function () {
        var state = $("#add_feed_txt");
        if (state.hasClass("selected")) {
            //$("#add_feed_hidden").addClass("hidden");
            $("#add_feed_hidden").slideUp("fast");
            state.removeClass("selected");
        } else {
            //$("#add_feed_hidden").removeClass("hidden");
            $("#add_feed_hidden").slideDown("fast");
            state.addClass("selected");
        }
    });
    $("input.error").live("keydown", function () {
        $(this).removeClass("error");
    });
    $("#rss_submit").click( function () {
        var inputs = new Array();
        var alias = $("#alias").val();
        var err = null;
        if (!alias) {
            $("#alias").addClass("error");
            err = true;
        }
        var ttl = $("#ttl").val();
        if (!ttl) {
            $("#ttl").addClass("error");
            err = true;
        }
        var url = $("#url").val();
        if (!url) {
            $("#url").addClass("error");
            err = true;
        } else {
            url = encodeURIComponent(url);
        }
        if (err) {
            return false;
        } else {
            socket.send("request=add_rss&alias=" + alias + "&ttl=" + ttl + "&uri=" + url)
        }
    });
    $(".remote_row").live("click", function () {
        var nxt = $(this).next();
        if (nxt.hasClass("hidden")) {
            nxt.slideDown("fast");
            nxt.removeClass("hidden");
        } else {
            nxt.slideUp("fast");
            nxt.addClass("hidden");
        }
    });
    $(".rss_delete").live("click", function () {
        var ID = $(this).parent().parent().parent().attr("id").split("feed_")[1];
        if (confirm("Are you sure you want to delete this RSS feed?")) {
            socket.send("request=remove_rss&ID=" + ID);
        }
    });
    $(".rss_enable").live("click", function () {
        var ID = $(this).parent().parent().parent().attr("id").split("feed_")[1];
        socket.send("request=enable_rss&ID=" + ID);
    });
    $(".rss_disable").live("click", function () {
        var ID = $(this).parent().parent().parent().attr("id").split("feed_")[1];
        socket.send("request=disable_rss&ID=" + ID);
    });
    $(".add_filter_button").live("click", function () {
        var ID = $(this).parents(".remote_setting").attr("id").split("feed_")[1];
        //var newf = $(this).parent().next();
        //var newfval = newf.val()
        //if (!newfval) {
        //    newf.focus();
        //    return false;
        //}
        //socket.send("request=add_rss_filter&ID=" + ID + "&restring=" + encodeURIComponent(newfval));
        
        var positivevals = new Array();
        var negativevals = new Array();
        $(this).closest(".add_filter_div").children().each( function () {
            if (($(this).hasClass("add_filter") || $(this).hasClass("and_filter")) && $(this).children("input")[0].value !== "") {
                positivevals.push( $(this).children("input")[0].value );
            } else if ($(this).hasClass("not_filter") && $(this).children("input")[0].value !== "") {
                negativevals.push( $(this).children("input")[0].value );
            }
        });
        positivevals = positivevals.join("||||||");
        negativevals = negativevals.join("||||||");
        var name = $(this).closest(".remote_setting").attr("id").split("remote_settings_")[1];
        
        if (positivevals !== "") {
            socket.send("request=add_rss_filter&ID=" + ID + "&positive=" + encodeURIComponent(positivevals) + "&negative=" + encodeURIComponent(negativevals));
        }
    });
    
    $(".filter_select").live("change", function() {
        var selectelem = $("<select class='filter_select'><option selected='selected'>---</option><option>and</option><option>not</option></select>");
        var andinput = $("<input name='add_filter' class='input_filter' type='text' placeholder='Filter' />");
        var notinput = $("<input name='not_filter' class='input_filter' type='text' placeholder='Negative Filter' />");
        if ($(this).val() == "---") {
            if ($(this).parent().children("select").length == 2) {
                $(this).parent().prev().append($(this));
                $(this).parent().next().remove();
            } else {
                $(this).parent().remove();
            }
        } else if ($(this).val() == "and") {
            if ($(this).next().length > 0) {
                $(this).parent().toggleClass("not_filter and_filter");
                $(this).next().attr("placeholder", "Filter");
                return;
            }
            $(this).parent().after(
                $("<div class='and_filter' />")
                .append(andinput)
                .append(selectelem)
            );
            $(this).parent().next().prepend($(this));
        } else if ($(this).val() == "not") {
            if ($(this).next().length > 0) {
                $(this).parent().toggleClass("not_filter and_filter");
                $(this).next().attr("placeholder", "Negative Filter");
                return;
            }
            $(this).parent().after(
                $("<div class='not_filter' />")
                .append(notinput)
                .append(selectelem)
            );
            $(this).parent().next().prepend($(this));
        }
    });
    
    $(".filter_group").live("click", function () {
        var ID = $(this).parents(".remote_setting").attr("id").split("feed_")[1];
        var index = $(".filter_group", $(this).parent()).index($(this));
        var c = confirm("Are you sure you want to remove this filter?");
        if (c) {
            socket.send("request=remove_rss_filter&ID=" + ID + "&index=" + index);
        }
    });
});

function onOpen (evt) {
    console.log("autoSocket opened", evt, socket);
    runInit();
}

function onMessage (evt) {
    if (evt.data.indexOf("ERROR") === 0) {
        console.log(evt.data);
        socket.close();
    } else {
        var response = JSON.parse(evt.data);
        if (response.request == "get_rss") {
            if (response.error) {
                console.log("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            runPostInit(response.response);
        } else if (response.request == "add_rss") {
            if (response.error) {
                alert("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            window.location.replace(window.location);
        } else if (response.request == "remove_rss") {
            if (response.error) {
                alert("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            window.location.replace(window.location);
        } else if (response.request == "enable_rss") {
            if (response.error) {
                alert("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            socket.send("request=get_rss_single&ID=" + response.name);
        } else if (response.request == "disable_rss") {
            if (response.error) {
                alert("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            socket.send("request=get_rss_single&ID=" + response.name);
        } else if (response.request == "add_rss_filter") {
            if (response.error) {
                console.log("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            socket.send("request=get_rss_single&ID=" + response.name);
        } else if (response.request == "remove_rss_filter") {
            if (response.error) {
                console.log("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            socket.send("request=get_rss_single&ID=" + response.name);
        } else if (response.request == "get_rss_single") {
            if (response.error) {
                console.log("ERROR in request " + response.request + ": " + response.error);
                return false;
            }
            // replace
            var ID = response.name;
            var resp = response.response;
            $("#feed_id_" + ID).replaceWith($(resp[0]));
            //var hid = $("#feed_" + ID).hasClass("hidden");
            var drop = $(resp[1]);
            $("#feed_" + ID).children().replaceWith(drop.children());
            
        } else {
            console.log("socket message:", evt.data)
        }
    }
}

function runInit() {
    socket.send("request=get_rss");
}

function runPostInit(rows) {
    $("div#temp").remove();
    var table = $("table#feeds > tbody");
    for (i=0; i<rows.length; i++) {
        table.append($(rows[i]));
    }
}