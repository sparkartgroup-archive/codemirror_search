// Method parameters:
// query:   can be a string or a regex
// options: 'ignoreCase': true/false
//          'regexp'    : true/false
//          'highlight' : true/false (highlights all matches if document under 2000 lines)
// text:    for replace methods only. Specifies what to replace matches with

(function($) {
    var SearchState = function() {
        this.posFrom    = null;
        this.posTo      = null;
        this.query      = null;
        this.cursor     = null;
        this.marked     = [];

        // Saving Options
        this.options    = {};
    }

    var _getSearchState = function(cm) {
        return cm._searchState || (cm._searchState = new SearchState());
    }

    var _getSearchCursor = function(cm, query, pos, ignoreCase) {
        return cm.getSearchCursor(query, pos, ignoreCase);
    }

    var _defaultSettings = function(options) {
        return $.extend({
            'ignoreCase' : false,
            'regexp'     : false,
            'highlight'  : true
        }, options)
    }

    var _parseQuery = function(query, options) {
        var settings = $.extend({
            'regexp'    : false,
            'ignoreCase': false
        }, options)
        
        if (settings['regexp']) {
            return new RegExp(query, settings['ignoreCase'] ? 'i' : '');
        } else {
            return query;
        }
    }

    var _find = function(cm, query, options, reverse) {
        var state = _getSearchState(cm);
        query = _parseQuery(query, options);
        if (state.query && state.query.toString() === query.toString() && state.options['ignoreCase'] === options['ignoreCase'] && state.options['regexp'] === options['regexp']) return _next(cm, reverse);

        clearSearch(cm);
        var settings = _defaultSettings(options);

        cm.operation(function() {
            if (!query || state.query) return;
            state.query = query;
            state.options = settings;

            if (settings['highlight'] && cm.lineCount() < 2000) { // This is too expensive on big documents.
                for (var cursor = _getSearchCursor(cm, state.query, null, state.options['ignoreCase']); cursor.findNext();) {
                    state.marked.push(cm.markText(cursor.from(), cursor.to(), "CodeMirror-searching"));
                };
            }

            state.posFrom = state.posTo = cm.getCursor();
            _next(cm, reverse);
        });
    }

    var _next = function(cm, reverse) {
        var state = _getSearchState(cm);

        cm.operation(function() {
            var cursor = _getSearchCursor(cm, state.query, reverse ? state.posFrom : state.posTo, state.options['ignoreCase']);

            if (!cursor.find(reverse)) {
                cursor = _getSearchCursor(cm, state.query, reverse ? {line: cm.lineCount() - 1} : {line: 0, ch: 0}, state.options['ignoreCase']);
                if (!cursor.find(reverse)) return;
            }

            state.cursor = cursor;
            cm.setSelection(cursor.from(), cursor.to());
            state.posFrom = cursor.from();
            state.posTo = cursor.to();
        });
    }

    var find = findNext = function(cm, query, options) {
        _find(cm, query, options)
    }

    var findPrev = function(cm, query, options) {
        _find(cm, query, options, true);
    }

    var clearSearch = function(cm) {
        cm.operation(function() {
            var state = _getSearchState(cm);
            // cm.setCursor(cm.getCursor()); // Removes the last highlighted search result

            if (!state.query) return;
            state.query = null;
            state.cursor = null;
            for (var i = 0; i < state.marked.length; ++i) state.marked[i].clear();
            state.marked.length = 0;
        });
    }

    var _doReplace = function(cm, cursor, text) {
        var state = _getSearchState(cm);
        var query = state.query;

        if (state.options['regexp']) {
            var match = cm.getRange(cursor.from(), cursor.to()).match(query);
            cursor.replace(text.replace(/\$(\d)/g, function(w, i) {
                return match[i] ? match[i] : '';
            }));
        } else {
            cursor.replace(text);
        }
    }

    // replaces found query with text
    var replace = function(cm, query, text, options) {
        var state = _getSearchState(cm);
        var query, cursor;

        if ((query = state.query) && (cursor = state.cursor)) {
            if (state.options['regexp']) {
                var match = cm.getRange(cursor.from(), cursor.to()).match(query);
                if (match) {
                    cursor.replace(text.replace(/\$(\d)/g, function(w, i) {
                        return match[i] ? match[i] : '';
                    }));
                }
            } else {
                cursor.replace(text);
            }
            cm.setSelection(cursor.from(), cursor.to());
        }
    }

    var findReplace = function(cm, query, text, options) {
        replace(cm, query, text, options);
        _find(cm, query, options);
    }

    // Replaces all query with text and returns the total number of replacements
    // Wrap everything in 1 undo function
    var replaceAll = function(cm, query, text, options) {
        var settings = _defaultSettings(options);

        if (!query) return;
        query = _parseQuery(query, options);

        var count = 0;
        cm.compoundChange(function() {
            cm.operation(function() {
                var cursor = _getSearchCursor(cm, query, null, settings['ignoreCase']);
                var match = cursor.findNext();
                while (match) {

                    if (settings['regexp']) {
                        cursor.replace(text.replace(/\$(\d)/g, function(w, i) {
                            return match[i] ? match[i] : '';
                        }));
                    } else {
                        cursor.replace(text);
                    }

                    match = cursor.findNext();
                    count++;
                };
            });
        });

        clearSearch(cm);

        return count;
    };

    CodeMirror.defineExtension("findNext",    function(query, options) { findNext(this, query, options) });
    CodeMirror.defineExtension("findPrev",    function(query, options) { findPrev(this, query, options) });
    CodeMirror.defineExtension("clearSearch", function() { clearSearch(this) });
    CodeMirror.defineExtension("replace",     function(query, text, options) { replace(this, query, text, options) });
    CodeMirror.defineExtension("findReplace", function(query, text, options) { findReplace(this, query, text, options) });
    CodeMirror.defineExtension("replaceAll",  function(query, text, options) { replaceAll(this, query, text, options) });
})(jQuery);