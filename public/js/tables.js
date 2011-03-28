$(document).ready(function(){
if ($('.datatable').length) {

    $.fn.dataTableExt.afnSortData['data'] = function  ( oSettings, iColumn )
    {
        var aData = [];
        $( 'td:eq('+iColumn+')', oSettings.oApi._fnGetTrNodes(oSettings) ).each( function () {
            aData.push( $(this).data('sort-value') );
        } );
        return aData;
    };

    var aoColumns = [];
        $('.datatable th').each(function(){
            var $this = $(this);
            aoColumns.push( $this.data('sSortDataType')
                    ? {
                        sSortDataType: $this.data('sSortDataType'),
                        sType: $this.data('sType'),
                        asSorting: [ "desc", "asc" ]
                    } : null);
        });

    var table = $('.datatable').dataTable({
        bFilter:        false,
        bInfo:          false,
        bLengthChange:  false,
        bPaginate:      false,
        aoColumns:      aoColumns,
        oLanguage:      { sEmptyTable:    'Nothing to show! <strong> So sad</strong>.' },
        aaSorting:      [ [$('.datatable').data('sort-column') || 0, $('.datatable').data('sort-direction') || 'asc' ] ]
    });

    new FixedHeader(table);

    //$('.content .datatable th').css({visibility: 'hidden'});
    $('.datatable:not(.candidates)').delegate('tr', 'click', function(){
        var $tr = $(this),
            $a = $tr.find('A');
        if ($a.length){
            document.location = $a.attr('href');    
        }
    });

}

});
