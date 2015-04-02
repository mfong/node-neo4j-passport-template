$('.user-action').click(function(e) {
	e.preventDefault();

	var el = $(this);
	var url = $(this).attr('data-url');

	$.post(url, function (data) {
		if (data.status == 'success') {
			if (url.indexOf('/follow') > -1) {
				el.attr('data-url', el.attr('data-url').replace('/follow', '/unfollow'));
				el.text('Following');
			} else if (url.indexOf('/unfollow') > -1) {
				el.attr('data-url', el.attr('data-url').replace('/unfollow', '/follow'));
				el.text('Follow');
			}
		}
	});
});