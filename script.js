// jQuery block for handling hash-based navigation
(function ($) {
  // This function runs every time the window loads or the hash changes
  $(window).on('load hashchange', function() {
    // Hide all content regions initially
    $('.content-region').hide();

    // Get the current hash or use the first menu item if no hash
    var region = location.hash || $('.main-menu a:first').attr('href');
    
    // Show the region specified in the hash
    $(region).show();

    // Remove 'active' class from all and then add to the current item
    $('.main-menu a').removeClass('active');
    $('.main-menu a[href="' + region + '"]').addClass('active');
  });
})(jQuery);

// Plain JavaScript for smooth scrolling
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
