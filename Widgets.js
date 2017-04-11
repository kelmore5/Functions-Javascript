/**
 * Created by kyle on 4/11/17.
 */
require(['dojo/_base/array', 'dojox/layout/ContentPane', 'dojo/aspect', 'dijit/form/Button',
        'dijit/form/TextBox', 'dijit/registry', 'dijit/Dialog', 'dojox/widget/Standby',
        'dijit/layout/LayoutContainer'],
    function(array, ContentPane, aspect, Button, TextBox, registry, Dialog, Standby, LayoutContainer) {

        /**
         * Destroys all the widgets in a dijit object
         * Better than normal removal methods because de-registers the ID of each
         * widget from the dijit registry
         * @param divToDestroy The id of the object to remove widgets from
         */
        var destroyWidgets = function (divToDestroy) {
            if (divToDestroy != null) {
                var resetWidgets = registry.findWidgets(divToDestroy);
                dojo.forEach(resetWidgets, function (w) {
                    w.destroyRecursive(false);
                });
            }
        };

        /**
         * Adds a tab for a TabContainer that includes both a main content for data
         * along with a LayoutContainer to add extra features in (e.g. this is usually used for Button(s))
         *
         * @param tabContainer - the TabContainer the ContentPane is being added to
         *
         * @param mainContent - the widget to set as the main content for the LayoutContainer
         * 						typically: a grid for data
         *
         * @param tabTitle - the title of the tab
         *
         * @param extraLayoutId - the ID for the layout to be inserted in the tab after the main content
         */
        var createTabWithGridAndLayout = function(tabContainer, tabTitle, mainContent, extraLayoutID) {
            var lc = new LayoutContainer({
                style: "width: 100%; height:100%; overflow:auto"
            });

            var cp = new ContentPane({
                content: mainContent,
                region: "center",
            });

            lc.addChild(cp);

            tabContainer.addChild(new ContentPane({
                title: tabTitle,
                content:lc
            }));

            dojo.create("div", {id: extraLayoutID,}, mainContent.domNode, "after");
        };

        /**
         * Destroy all the widgets in a content pane and optionally the pane itself
         * @param id The id of the pane
         * @param destroyPane True if the pane should be destroyed, false otherwise
         */
        var destroyContentPaneWidgets = function(pane, destroyPane){
            try {
                array.forEach(registry.findWidgets(dojo.byId(pane)), function(w) {
                    w.destroyRecursive();
                });

                if(destroyPane) {
                    dijit.byId(pane).destroyRecursive();
                }
            } catch(ex) {}
        };

        /**
         * Creates a standby object
         * @param target The widget to overlay the standby on
         * @returns {*} The standby object
         */
        var createStandby = function(target) {
            var standby = new Standby({target: target});
            document.body.appendChild(standby.domNode);
            standby.startup();
            standby.show();

            return standby;
        };

        /**
         * Creates a removal standby object for a specific widget
         * @param target The widget to overlay the standby on
         * @param eventWidget The widget that determines when the standby ends
         * @param event The event that determines when the standby will end
         */
        var createStandbyWithRemove = function(target, eventWidget, event) {
            var standby = createStandby(target);

            var listener = null;
            listener = aspect.after(eventWidget, event, function() {
                standby.destroyRecursive();
                listener.remove();
            });
        };

        /**
         * Easy button generator
         * @param label The label for the button
         * @param id The id
         * @param onclick OnClick function
         */
        var buttonGenerator = function(label, id, onclick, style) {
            new Button({
                label: label,
                onClick: onclick,
                style: style
            }, id);
        };

        /**
         * Creates a textbox with some default info (style/trim)
         * @param name The name of the textbox
         * @param value Default value for textbox
         * @param id The id
         */
        var textBoxGenerator = function(name, value, id) {
            new TextBox({
                trim: true,
                name: name,
                value: value,
                style: "width:32em;"
            }, id);
        };

        /**
         * Creates an error dialog with an ok button
         * @param text The text to put in the dialog
         */
        var showErrorDialog = function(text) {
            new Dialog({
                title: "Error",
                addOkButton: true,
                content: text
            }).show();
        };

        /**
         * Creates a submit dialog
         * @param text The text to put in the dialog
         * @param okFunction The event to carry out when ok is clicked
         * @param title The title of the dialog
         */
        var showSubmitDialog = function(text, okFunction, title) {
            showMessageDialog(text, okFunction, true, title);
        };

        /**
         * Creates a submit dialog
         * @param text The text to put in the dialog
         * @param okFunction The event to carry out when ok is clicked
         * @param addCancelButton Adds a cancel button to the message dialog
         * @param title The title of the dialog
         */
        var showMessageDialog = function(text, okFunction, addCancelButton, title) {
            new Dialog({
                title: title == null ? "Message" : title,
                addOkButton: true,
                addOkButtonFunction: okFunction != null ? okFunction : null,
                addCancelButton: addCancelButton,
                content: text
            }).show();
        };

        /**
         * Used to close all the tabs on a table using the table id. First gets the tabs and then removes them
         * Optional: List of button ids (buttonIds) to disable if there is a button relating to tabs
         * @param tableId the id of the table to close the tabs of
         * @param buttonIds optional list of buttons to disable if tabs are closed
         */
        var closeAllTheTabs = function(tableId, buttonIds) {
            dijit.byId(tableId).closeAll();

            //Set the close all tabs button to disabled if id does not equal null
            if(buttonIds != null) {
                array.forEach(buttonIds, function(id, i) {
                    dijit.byId(id).set("disabled", true);
                });
            }
        };

        /**
         * Sets the disabled feature an HTML element
         * @param boxId The id of the element to enable or disable
         * @param value False if element should not be disabled, true otherwise
         */
        var setDisabled = function(boxId, value) {
            var box = dijit.byId(boxId);
            box.set('disabled', value);
        };

    }
);