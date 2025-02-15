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

function toggleAbstract(abstractId) {
    var element = document.getElementById(abstractId);
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
        document.querySelector(`span[onclick="toggleAbstract('${abstractId}')"]`).innerHTML = 'Abstract &#9650;'; // Change to up arrow when open
    } else {
        element.style.display = 'none';
        document.querySelector(`span[onclick="toggleAbstract('${abstractId}')"]`).innerHTML = 'Abstract &#9660;'; // Revert to down arrow when closed
    }
}

function toggleCoursework(courseworkId) {
    var element = document.getElementById(courseworkId);
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
        document.querySelector(`span[onclick="toggleCoursework('${courseworkId}')"]`).innerHTML = 'Relevant Coursework &#9650;'; // Change to up arrow when open
    } else {
        element.style.display = 'none';
        document.querySelector(`span[onclick="toggleCoursework('${courseworkId}')"]`).innerHTML = 'Relevant Coursework &#9660;'; // Revert to down arrow when closed
    }
}
