/**
 * Created by kelmore5 on 4/6/17.
 */

//noinspection JSUndeclaredVariable
require(['dojo/store/JsonRest', 'dojox/grid/EnhancedGrid', 'dojo/data/ObjectStore', 'dojo/store/Memory',
        'dojo/store/Cache', 'dojo/store/Observable'],
    function(JsonRest, EnhancedGrid, ObjectStore, Memory, Cache, Observable) {

        /**
         * Function to enable or disable buttons based on selections in a Dojox datagrid
         * Enables if multiple items are selected
         * @param gridId The grid to determine the button status
         * @param buttonId The button to enable or disable
         */
        var enableButtonOnAnySelection = function(gridId, buttonId) {
            var grid = dijit.byId(gridId);
            var items = grid.selection.getSelected();
            var button = dijit.byId(buttonId);
            if (items.length) {
                button.set('disabled', false);
            }
            else {
                button.set('disabled', true);
            }
        };

        /**
         * Function to enable or disable buttons based on selections in a Dojox datagrid
         * Enables if only one item is selected
         * @param gridId The grid to determine the button status
         * @param buttonId The button to enable or disable
         */
        var enableButtonForSingle = function(gridId, buttonId) {
            var grid = dijit.byId(gridId);
            var items = grid.selection.getSelected();
            var button = dijit.byId(buttonId);
            if (items.length == 1) {
                button.set('disabled', false);
            }
            else {
                button.set('disabled', true);
            }
        };

        /** Creates an object store to be put in a grid
         *
         * @param urlMapping - The url that the servlet maps to in the Web.xml file
         */
        var createDefaultObjectStore = function(urlMapping) {
            return new ObjectStore({objectStore: new JsonRest({target: urlMapping, syncMode: true,})});
        };

        /**
         * Creates a cache store, fetches the information from the query
         * (thus writing the information to cache), and returns an ObjectStore
         * Used for DataGrids and allows for client-side sorting
         *
         * @param jsonStore A store object (e.g. JsonStore)
         * @param gridId The id of the grid (e.g. DataGrid) the store is going into
         * @param query OPTIONAL A query to use
         */
        var createCacheStore = function(gridId, jsonStore, query, tabIndex) {
            query = (query == null) ? "" : query;
            //Wrapping new memory in observable to allow sorting
            //Need to overwrite put function as well to put id in
            //WILL NOT WORK OTHERWISE
            var storeMemory = new dojo.store.Observable(new dojo.store.Memory({
                // Observable only works correctly when object has an id. Memory store does not add id to object when creating an object
                // see bugs http://bugs.dojotoolkit.org/ticket/12835 and http://bugs.dojotoolkit.org/ticket/14281
                // Will be fixed with dojo 1.8
                // Also Observable does not work correctly with JsonRest. Therefore we use the grid with the Memory Store and the Observable
                put: function(object, options) {
                    var data = this.data, index = this.index, idProperty = this.idProperty;
                    var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
                    if (id in index) {
                        if (options && options.overwrite === false) {
                            throw new Error("Object already exists");
                        }
                        data[index[id]] = object;
                    }
                    else {
                        index[id] = data.push(object) - 1;
                    }
                    return id;
                }
            }));

            //Create the cache store with the jsonStore and memoryStore
            var cacheStore = new dojo.store.Cache(jsonStore, storeMemory);

            //Query the cache to store the results in memory
            //Afterwards, check if there were any results. If not,
            //tell the user
            cacheStore.query(query).then(function() {
                if(storeMemory.data.length == 0) {
                    dijit.byId(gridId).getChildren()[tabIndex-1].content.showMessage("Unfortunately, no results were found. Please check your input and resubmit.");
                }
            });

            return new dojo.data.ObjectStore({objectStore: storeMemory});
        };

        /**
         * Creates a json object
         * @param key The key value
         * @param value The value
         * @returns {{}} A json representation (key -> value)
         */
        var createJsonObject = function(key, value) {
            var obj = {};
            obj[key] = value;
            return obj;
        };

    }
);