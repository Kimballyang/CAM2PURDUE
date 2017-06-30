$(document).ready(function(){
	var counter = 0;
	$('#myCanvas').on("annotate-image-added", function(event, id, path){
		$(".my-image-selector").append("<label><input type=\"radio\" name=\"image-selector\" class=\"annotate-image-select\" value=\"" + path + "\" checked id=\"" + id + "\"><img src=\"" + path + "\" width=\"35\" height=\"35\"></label>");
	});
	var options = {
		width: "640",          // Width of canvas
  		height: "400",         // Height of canvas
		color: 'red',
		bootstrap: true,
		images: ['https://www.w3schools.com/css/trolltunga.jpg'],
		onExport: function(image){
			if ($("#exported-image").length > 0){
				$("#exported-image").remove();
			}
			$("body").append("<img src=\"" + image + "\" id=\"exported-image\">");
		},
		selectEvent: "change", // listened event on .annotate-image-select selector to select active images
  		unselectTool: true,   // Add a unselect tool button in toolbar (useful in mobile to enable zoom/scroll)
	}


	$('#myCanvas').annotate(options);

	$(".push-new-image").click(function(event) {
		if (counter === 0){
			$('#myCanvas').annotate("push", "https://www.smashingmagazine.com/wp-content/uploads/2015/06/10-dithering-opt.jpg");
			counter += 1;
		}else{
			$('#myCanvas').annotate("push", {id:"unique_identifier", path:"http://i.imgur.com/RRUe0Mo.png"});
			
		}
	});

	$(".submit-image").click(function(event) {
		$('#myCanvas').annotate("get", null, function(d) {
			console.log(d);
		});
	});
});