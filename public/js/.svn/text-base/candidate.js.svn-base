$(document).ready(function(){

    var $hover_details = $('.candidate-hover-details'),
        $hover_details_content = $('.candidate-hover-details-content'),
        $current_candidate,
        hideTimeout;

    function hide_details(){
        if ($current_candidate) {
            hideTimeout && clearTimeout(hideTimeout);
            $current_candidate.removeClass('hover');
            $hover_details.css({left: -1000});
        }
    }

    $('.content').delegate('.candidate-mini', 'mouseenter', function(){

        hide_details();
        $current_candidate = $(this);
        var $details = $(this).find('.details');

        $current_candidate.addClass('hover');

        $hover_details_content
                .html($details.html());

        $hover_details
            .position({
                my: 'left bottom',
                at: 'right bottom',
                of: $current_candidate
             })
            .css({backgroundColor: $current_candidate.children('.tag').css('backgroundColor')})
            .show();

    })
    .delegate('.candidate-mini', 'mouseleave', function(){
        hideTimeout = setTimeout(hide_details, 500);
    });

    $hover_details.bind('mouseenter', function(){
        clearTimeout(hideTimeout);
    })
    .bind('mouseleave', function(){
        hideTimeout = setTimeout(hide_details, 500);
    });    

});