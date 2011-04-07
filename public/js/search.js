$(document).ready(function(){
    $('.search-results').isotope({
        itemSelector : '.result',
        layoutMode : 'fitRows'
    });


    function fix_query(query) {
        return (query || '').replace(/[^a-zA-Z]/g, ' ').trim().replace(/\s+/g, '-').toLowerCase();
    }
    var $q = $('.query');

    function submit() {
        var search_for = fix_query($q.val());
        document.location = '/search/' + search_for;
        return false;
    }

    $('.search .button').click(submit);

    $('.search').submit(submit);
    var search_for = $.trim($q.val() || '');
    if (search_for) {
        $('.name, .source').highlight( search_for );
        $('.highlight').parent().addClass('highlighted');
        var $find_in = $('.name:not(.highlighted), .source:not(.highlighted)');
        $.each(search_for.split(' '), function(i, word){
            word && word.length && $find_in.highlight( word );
        });
    }

    $('.search-link').bind('click', function(){
        $q.val('').focus();
        return false;
    });

    setTimeout(function() {
    $('.color0 .candidate-hover-details-content').noisy({
        'intensity' : 1,
        'size' : 200,
        'opacity' : 0.123,
        'fallback' : '',
        'monochrome' : false
    });
    }, 100);
});