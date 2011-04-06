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
        } else {
            $this.toggleClass('filter-out');
        }

        $('.swimlane .candidate-mini' + filter_query + '').css({opacity: 1});

        var filter = $.makeArray($('.filter-out').map(function(){return  ':not(' + $(this).data('filter') + ')';})).join('');
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