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
});