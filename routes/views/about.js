var keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'about';
	locals.page.title = 'About SydJS';
	
	locals.organisers = [
		{ name: 'W.S Jeong', image: '/images/jws.jpg', twitter: 'neoxio',       title: 'Founder, Mind AI Creator' },
		{ name: 'Zian JJ',     image: '/images/zian.jpg',     twitter: 'zian',   title: 'AI Developer' },
		{ name: 'Y.H LEE',    image: '/images/lyh.jpg',    twitter: 'zistar',   title: 'Design coordinator' },
		{ name: 'Zistar Chale', image: '/images/putty.jpg', twitter: 'zichan', title: 'Community coordinator' }
	]
	
	view.render('site/about');
	
}
