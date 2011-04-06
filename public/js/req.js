$(document).ready(function(){
    var $req = $('.req');

    function submit() {
        $req.submit();
        return false;
    }

    function update(textarea){
        var $textarea = $(textarea),
            name = $textarea.attr('name'),
            raw = $textarea.val();

        $.storage.set(name, raw);


        $.ajax('/md', { data: { text: raw}} )
            .success(function(data){
                var $preview = $('.preview .req-' + name);

                    data.length ?
                            $preview
                                .removeClass('hidden')
                                .find('div')
                                    .html(data)
                            : $preview.addClass('hidden');
                });

        return false;
    }

    $('.req textarea')
        .flextarea({minRows: 5})
        .bind('keydown change paste', function() {
                    var $textarea = $(this);
                    setTimeout(function(){
                        update($textarea);
                    }, 1);
                })
        .each(function(){
            var $textarea = $(this),
                name = $textarea.attr('name'),
                raw =  $.storage.get(name);
            if (name != 'instructions' && raw && raw.length) {
                $textarea.html(raw);
                update($textarea);
            }
        });
});