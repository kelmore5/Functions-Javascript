require(['dojo/_base/array', 'dojo/aspect', 'dijit/form/Button', 'dijit/form/TextBox', 'dojo/_base/lang',
        'dojox/grid/EnhancedGrid', 'dijit/Dialog', "dojo/_base/window", "dojo/dom-style",
        'dojo/_base/Deferred', "dojox/html/metrics", 'dojox/grid/util', "dojo/_base/html",
        'dojo/date/stamp', 'dijit/form/DateTextBox'],
    function(array, aspect, Button, TextBox, lang, EnhancedGrid, Dialog, win, domStyle, Deferred, metrics,
             util, html, stamp) {

        //Extends the TextBox class to include error message handling
        lang.extend(TextBox, {
            rowIndex: 0,
            errorMessage: undefined,

            //What needs to be checked for all textboxes
            //Optional error message argument to replace default
            checkValue: function (errorMessage) {
                var deferred = new Deferred();
                var _this = this;

                if (_this.maxLength) {
                    if (_this.get("value").length > _this.maxLength) {
                        var errorMessage2 = _this.title + " name is too long. The max length for " + _this.title + " is " + _this.maxLength + " characters.";
                        deferred.resolve({success: _this.changeState(false, errorMessage2)});
                        return deferred.promise;
                    }
                }

                _this.extraValueCheck().then(function () {
                    deferred.resolve({success: _this.changeState(true)});
                }, function (err) {
                    deferred.reject({success: _this.changeState(false, errorMessage)});
                });

                return deferred.promise;
            },

            //An extra value check for textboxes
            //Can be set to whatever the developer wants
            //In other words: checkValue runs, and then whatever
            //function is in extraValueCheck is run
            //Just make sure extraValueCheck returns a deferred.promise value
            //Maybe turn into event later
            extraValueCheck: function () {
                var deferred = new Deferred();
                var _this = this;
                _this.get("state") != "Error" ? deferred.resolve({success: true}) : deferred.reject({success: _this.changeState(false)});
                return deferred.promise;
            },

            //Checks the state of the widget
            //Takes in boolean operator and prints out (optional) error message
            //if boolean returned false
            //Used in changeMode.jsp
            changeState: function (bool, errorMessage) {
                var _this = this;

                if (bool) {
                    _this.state = "Success";
                } else {
                    _this.state = "Error";
                    if (errorMessage) {
                        _this.showErrorMessage(errorMessage);
                    } else if (_this.errorMessage) {
                        _this.showErrorMessage(_this.errorMessage);
                    }
                }

                return bool;
            },

            showErrorMessage: function (errorMessage) {
                showErrorDialog(errorMessage);
            }
        });

        /**
         * Extends dijit dialog to include options for an ok and cancel button
         * Also adds functionality to include an event on the ok button
         */
        lang.extend(Dialog, {
            addOkButton: false,

            addOkButtonFunction: null,

            addCancelButton: false,

            postCreate: function () {
                domStyle.set(this.domNode, {
                    display: "none",
                    position: "absolute"
                });
                win.body().appendChild(this.domNode);

                this.inherited("postCreate", arguments);

                this.connect(this, "onExecute", "hide");
                this.connect(this, "onCancel", "hide");
                this._modalconnects = [];

                if (this.addOkButton || this.addCancelButton) {
                    var dialog = this.id;

                    dojo.create("div", {
                            id: dialog + "buttonContainer",
                            style: {
                                "background-color": "#EFEFEF", "border-top": "1px solid #d3d3d3",
                                padding: "3px 5px 2px 7px", "text-align": "center"
                            }
                        },
                        this.containerNode, "after");

                    if (this.addOkButton) {
                        var button = new Button({
                            label: "OK",
                            onClick: function () {
                                dijit.byId(dialog).destroy();
                            }
                        }).placeAt(this.id + "buttonContainer", "last");

                        if (this.addOkButtonFunction != null) {
                            var listener = null;
                            listener = aspect.after(button, "onClick", this.addOkButtonFunction);

                            var listener2 = null;
                            listener2 = aspect.after(button, "onClick", function () {
                                if (listener != null) {
                                    listener.remove();
                                }
                                else {
                                    listener2.remove();
                                }
                            });
                        }
                    }

                    if (this.addCancelButton) {
                        new Button({
                            label: "Return",
                            onClick: function () {
                                dijit.byId(dialog).destroy();
                            }
                        }).placeAt(this.id + "buttonContainer", "last");
                    }
                }
            },
        });

        /**
         * Extends the dojox enhanced grid class to add selected columns
         * This way, someone can select the entire column of a data grid
         */
        lang.extend(EnhancedGrid, {
            buildRendering: function () {
                if (this.enableColumnEdit) {
                    this.setupSelectableColumns();
                }

                this.inherited("buildRendering", arguments);
                if (!this.domNode.getAttribute('tabIndex')) {
                    this.domNode.tabIndex = "0";
                }
                this.createScroller();
                this.createLayout();
                this.createViews();
                this.createManagers();

                this.createSelection();


                this.connect(this.selection, "onSelected", "onSelected");
                this.connect(this.selection, "onDeselected", "onDeselected");
                this.connect(this.selection, "onChanged", "onSelectionChanged");

                metrics.initOnFontResize();
                this.connect(metrics, "onFontResize", "textSizeChanged");
                util.funnelEvents(this.domNode, this, 'doKeyEvent', util.keyEvents);
                if (this.selectionMode != "none") {
                    this.domNode.setAttribute("aria-multiselectable", this.selectionMode == "single" ? "false" : "true");
                }

                html.addClass(this.domNode, this.classTag);
                if (!this.isLeftToRight()) {
                    html.addClass(this.domNode, this.classTag + "Rtl");
                }
            },

            postCreate: function () {
                //create plugin manager
                this.pluginMgr = new this._pluginMgrClass(this);
                this.pluginMgr.preInit();
                this.inherited("postCreate", arguments);
                this.pluginMgr.postInit();

                if (this.enableColumnEdit) {
                    this.setupSelectableColumnEvents();
                }
            },

            //Set to enable editable columns
            enableColumnEdit: false,

            //Functoin to setup selecetable columns
            setupSelectableColumns: function () {
                var _this = this;

                this._wasClicked = false;

                if (this.plugins) {
                    if (!this.plugins.selector) {
                        this.plugins.selector = true;
                    }
                }
                else {
                    this.plugins.selector = true;
                }

                var newStructure = lang.clone(this.structure);
                newStructure[1] = new Array();

                //Adds a checkbox to each column header to allow column selection
                array.forEach(this.structure[1], function (layout, i) {
                    newStructure[1][i] = lang.clone(layout);
                    newStructure[1][i]["selected"] = false;
                    if (layout.selectable) {
                        newStructure[1][i]["title"] = newStructure[1][i]["name"];
                        newStructure[1][i]["input"] = '<input type="checkbox" id="' + _this.id + 'headerCheck' + i + '"/>';
                        newStructure[1][i]["name"] = newStructure[1][i]["input"] + newStructure[1][i]["name"];
                    }
                });

                this.structure = null;
                this.structure = newStructure;
                this.structure[1] = newStructure[1];
            },

            //Ability to select events when columns are selected
            setupSelectableColumnEvents: function () {
                var _this = this;

                aspect.before(this, "onHeaderCellClick", function (e) {
                    if (_this.structure[1][e.cell.index].selectable) {
                        var checked = dojo.byId(_this.id + "headerCheck" + e.cell.index).checked;
                        var wasClicked = (checked != _this.structure[1][e.cell.index].selected);

                        if (wasClicked) {
                            _this._wasClicked = true;

                            _this.structure[1][e.cell.index].selected = !_this.structure[1][e.cell.index].selected;
                            if (!_this.structure[1][e.cell.index].selected) {
                                //Otherwise, deselect it and reselect the affected rows
                                //(Deselecting a column also deselects the row, so we need to select the row again
                                var rows = _this.pluginMgr.getPlugin("selector").getSelected("row", true);
                                _this.pluginMgr.getPlugin("selector").deselect("col", e.cell.index);

                                array.forEach(rows, function (row, i) {
                                    _this.pluginMgr.getPlugin("selector").select("row", row.row);
                                });
                            }

                            _this.checkColumns();
                        }
                    }
                });

                aspect.after(this, "_resize", function () {
                    _this.checkColumns();
                });
                aspect.after(this.selection, "onDeselected", function () {
                    _this.checkColumns();
                });
            },

            setSortIndex: function (inIndex, inAsc) {
                // summary:
                // 		Sort the grid on a column in a specified direction
                // inIndex: Integer
                // 		Column index on which to sort.
                // inAsc: Boolean
                // 		If true, sort the grid in ascending order, otherwise in descending order

                if (this.enableColumnEdit) {
                    if (this._wasClicked) {
                        this._wasClicked = false;
                        return;
                    }
                }

                var si = inIndex + 1;
                if (inAsc != undefined) {
                    si *= (inAsc ? 1 : -1);
                } else if (this.getSortIndex() == inIndex) {
                    si = -this.sortInfo;
                }
                this.setSortInfo(si);
            },

            //Checks the columns the user has selected and highlights the datagrid
            checkColumns: function () {
                var _this = this;

                //Get the header checkbox array to determine which columns to select
                array.forEach(this.structure[1], function (layout, i) {
                    if (layout.selected) {
                        //Select the header checkbox and the column
                        document.getElementById(_this.id + "headerCheck" + i).checked = true;
                        _this.pluginMgr.getPlugin("selector").select("col", i);
                    }
                });
            }
        });

        /**
         * Adds a function to the date text box to return a foratted date
         */
        lang.extend(DateTextBox, {
            getFormattedDate: function () {
                var value;

                try {
                    value = stamp.toISOString(this.get("value"), {selector: 'date'});
                } catch (ex) {
                    value = this.get("value");
                }

                return value;
            }
        });

    }
);