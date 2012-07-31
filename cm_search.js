(function($) {
    $(window).load(function() {
        editor = CodeMirror.fromTextArea($('textarea')[0], {
            tabMode:        'indent',
            indentUnit:     4,
            indentWithTabs: true,
            lineNumbers:    true,
            lineWrapping:   false,
            matchBrackets:  true,
            smartIndent:    false,
            dragDrop:       false
        });

        $('button.replaceAll').live('click', function(e) {
            e.preventDefault();

            var query = $('input.find').val();
            var text  = $('input.replace').val();
            var options = {'ignoreCase': $('input.ignoreCase').prop("checked")};
            editor.replaceAll(query, text, options);
        });

        $('button.replace').live('click', function(e) {
            e.preventDefault();

            var query = $('input.find').val();
            var text = $('input.replace').val();
            var options = {'ignoreCase': $('input.ignoreCase').prop("checked")};
            editor.replace(query, text, options);
        });

        $('button.replaceFind').live('click', function(e) {
            e.preventDefault();

            var query = $('input.find').val();
            var text = $('input.replace').val();
            var options = {'ignoreCase': $('input.ignoreCase').prop("checked")};
            editor.findReplace(query, text, options);
        });

        $('button.previous').live('click', function(e) {
            e.preventDefault();

            var query = $('input.find').val();
            var options = {'ignoreCase': $('input.ignoreCase').prop("checked")};
            editor.findPrev(query, options);
        });

        $('button.next').live('click', function(e) {
            e.preventDefault();

            var query = $('input.find').val();
            var options = {'ignoreCase': $('input.ignoreCase').prop("checked")};
            editor.findNext(query, options);
        });
    });
}(jQuery));