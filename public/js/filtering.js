$(document).ready(function(){


    $('.swimlane').isotope({
        itemSelector : '.candidate-mini',
        layoutMode : 'straightDown'
    });





    function hide_title() {
        var $this = $(this);
        var filter_query = $this.data('filter');

        if (filter_query === '') {
            $('.titles a.title').addClass('filter-out');
        } else if (filter_query === '*') {
            $('.titles a.title').removeClass('filter-out');
        } else {
            $this.toggleClass('filter-out');
        }

        $('.swimlane .candidate-mini' + filter_query + '').css({opacity: 1});

        var metaFilter = $.makeArray($('.filter-out.meta-filter').map(function(){return $(this).data('filter');})).join('');
        var jobFilter = $.makeArray($('.filter-out:not(.meta-filter)').map(function(){return $(this).data('filter');})).join(',');
        var filter =  (metaFilter ? ':not(' + metaFilter + ')' : '')
                     + (jobFilter ? ':not(' + jobFilter + ')' : '');

        console.log(filter);

        $('.swimlane').isotope({
          itemSelector : '.candidate-mini',
          layoutMode : 'straightDown', filter: filter
        });
        return false;
    }

    $('.titles').delegate('A', 'mouseenter', function(){
        $('.swimlane .candidate-mini' + $(this).data('filter') + '').css({opacity: 0.5});
    })
    .delegate('A', 'mouseleave', function(){
        $('.swimlane .candidate-mini' + $(this).data('filter') + '').css({opacity: 1});
    })
    .delegate('A', 'click', hide_title);
});