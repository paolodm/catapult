$(document).ready(function(){

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

    if ($q.val()) {
        $('.name').highlight( $q.val() );
    }

    $('.search-link').bind('click', function(){
        $q.val('').focus();
        return false;
    });


    $('.color0 .candidate-hover-details-content').noisy({
        'intensity' : 1,
        'size' : 200,
        'opacity' : 0.123,
        'fallback' : '',
        'monochrome' : false
    });
});