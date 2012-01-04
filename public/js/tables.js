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

    try{
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

    } catch(err){console.log(err);}

    //$('.content .datatable th').css({visibility: 'hidden'});
    $('.datatable:not(.candidates)').delegate('tr', 'click', function(){
        var $tr = $(this),
            $a = $tr.find('A');
        if ($a.length){
            document.location = $a.attr('href');    
        }
    });

    var columns = $('.datatable th').length;
    var totals = new Array(columns);
    $('.datatable tr td').each(function(i){
        $td = $(this);
        value = parseInt($.trim($td.text()), 10);
        if (value || value === 0) {
            totals[i % columns] = (totals[i % columns] || 0) + value;
        }
    });

    var $tfoot = $('.datatable tfoot');
    $('.datatable th').each(function(i){
        $('<td>')
            .html(totals[i] || totals[i] === 0 ? totals[i] : '' )
            .appendTo($tfoot);
    });
    $tfoot.find('td:first-child').html('Totals');

}

});
