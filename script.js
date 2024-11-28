(function ($) {
  $(window).on('load hashchange', function(){
    // If the hash matches specific IDs, show/hide regions without preventing default behavior
    if (location.hash) {
      $('.content-region').hide();  // Hide all content regions
      var region = location.hash.toString();  // Get the hash
      $(region).show();  // Show the region that matches the hash
    }
  });
})(jQuery);
