(function ($) {
  $(window).on('load hashchange', function(){
    // Hide all content regions
    $('.content-region').hide();

    // Get the current hash or default to the first menu link if no hash
    var region = location.hash.toString() || $('.main-menu a:first').attr('href');
    
    // Show the region that matches the hash
    $(region).show();

    // Highlight the menu link associated with this region
    $('.main-menu a').removeClass('active');
    $('.main-menu a[href="'+ region +'"]').addClass('active');

    // Check if the hash corresponds to 'Professional' or 'Academia' and scroll to it
    if (region === '#professional-section' || region === '#academia-section') {
      scrollToSection(region.substring(1)); // Remove the hash and pass the ID
    }
  });
})(jQuery);

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
