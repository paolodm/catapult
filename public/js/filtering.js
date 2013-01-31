$(document).ready(function(){

    $('.swimlane').isotope({
        itemSelector : '.candidate-mini',
        layoutMode : 'straightDown'
    });

    function getHashArgs() {
        return window.location.hash.substring(1).split(',');
    }

    function hashContainsFilter(filterQuery) {
        return getHashArgs().indexOf(filterQuery) !== -1;
    }

    // If a job title ever contains a comma, you're gonna have a bad time
    getHashArgs().forEach(function(filterToExclude) {
        if (!filterToExclude) {
            return;
        }

        var $toHide = $('.titles .title').filter(function(index, elem) {
            return $(elem).data().filter === filterToExclude;
        });

        toggle_hide_title_of($toHide, true);
    });

    function toggle_hide_title_of($toHide, isDuringPageInit) {
        var filter_query = $toHide.data('filter');

        if (!isDuringPageInit) {
            var hashWithoutFilter = getHashArgs()
                .filter(function(elem) { return elem !== filter_query; })
                .join(','),

                hashWithFilter = (window.location.hash === '' ? '' : window.location.hash + ',' ) + filter_query;

            window.location.hash = hashContainsFilter(filter_query) ? hashWithoutFilter : hashWithFilter;
        }

        if (filter_query === '') {
            $('.titles a.title').addClass('filter-out');
        } else if (filter_query === '*') {
            $('.titles a.title').removeClass('filter-out');
        } else {
            $toHide.toggleClass('filter-out');
        }

        $('.swimlane .candidate-mini' + filter_query + '').css({opacity: 1});

        var metaFilter = $.makeArray($('.filter-out.meta-filter').map(function(){return $(this).data('filter');})).join('');
        var jobFilter = $.makeArray($('.filter-out:not(.meta-filter)').map(function(){return $(this).data('filter');})).join(',');
        var filter =  (metaFilter ? ':not(' + metaFilter + ')' : '')
            + (jobFilter ? ':not(' + jobFilter + ')' : '');

        $('.swimlane').isotope({
            itemSelector : '.candidate-mini',
            layoutMode : 'straightDown', filter: filter
        });
        return false;
    }

    function toggle_hide_title() {
        return toggle_hide_title_of($(this), false);
    }

    $('.titles').delegate('A', 'mouseenter', function(){
        $('.swimlane .candidate-mini' + $(this).data('filter') + '').css({opacity: 0.5});
    })
    .delegate('A', 'mouseleave', function(){
        $('.swimlane .candidate-mini' + $(this).data('filter') + '').css({opacity: 1});
    })
    .delegate('A', 'click', toggle_hide_title);
});