(function ($) {
  $(window).on('load hashchange', function(){
    $('.content-region').hide();  // Hide all content regions
    var region = location.hash.toString() || '#Home';  // Get the hash or default to '#Home'
    $(region).show();  // Show the region that matches the hash
  });
})(jQuery);
