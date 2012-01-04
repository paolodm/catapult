$(document).ready(function(){
    $.storage = new $.store();

    $(document).delegate('td', 'mouseenter', function(){
        $(this).find('.tick-count')
            .css({ height: $(this).height(), paddingTop: $(this).height() / 2 - 10 } )
            .fadeIn();
    }).delegate('td', 'mouseleave', function(){
        $(this).find('.tick-count')
            .fadeOut();
    });


});