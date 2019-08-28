$(document).ready(function() {


	// ----------------------------------------------------------------------------------------------------------
	// PLAYER
	// ----------------------------------------------------------------------------------------------------------


	$.urlParam = function(name) {
		var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (results == null) {
			return null;
		}
		return decodeURI(results[1]) || 0;
	}

	var episode = $.urlParam('episode');

	var url = '/ws/episode/last';
	if (episode) {
		url = '/ws/episode/id/' + episode
		$(window).scrollTop($('#topDivId').offset().top);
		window.history.pushState("", "", '/');
	}

	$.ajax({
			method: "GET",
			url: url
		}).done(function(data) {
			//console.log(data);

			var container = $("#lastEpisodeId");
			container.empty();

			$("<h4>").html('Ep ' + data.episode + ' - ' + data.title).appendTo(container);

			if (data.mediaFileName) {

				if (data.mediaType && data.mediaType.startsWith('audio')) {
					$('<audio>').css("width", "100%").attr({
						controls: "controls",
						preload: "none",
						src: "/media/episode/" + data.episode
					}).appendTo(container);
				}

				if (data.mediaType && data.mediaType.startsWith('video')) {
					$('<video>').css("width", "100%").attr({
						controls: "controls",
						preload: "none",
						src: "/media/episode/" + data.episode
					}).appendTo(container);
				}
			}
			$('<p>')
				.html(data.description)
				.appendTo(container);

			$('<p>').html('Par <strong>' + data.author + '</strong>').appendTo(container);

			$('<p>').append(
				$('<strong>').html("Téléchargements : ").append(
					$('<span>').addClass("badge badge-primary").html(data.downloadTotal)
				)
			).appendTo(container);

			$('<p>').text('Publié le ')
				.append(
					$('<span>').text((new Date(Date.parse(data.pubDate))).toLocaleDateString('fr-FR', {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
						hour: "numeric",
						minute: "numeric"
					}))
				).appendTo(container);

			$('<div>')
				.append(
					$('<input>')
					.attr('type', 'text')
					.attr('readonly', true)
					.addClass('form-control-plaintext')
					.attr('value', 'https://lavis-des-moutons.fr/?episode=' + data.episode)
					.attr('onClick', "this.select();")
				)
				.appendTo(container);
		})
		.fail(function() {

			var container = $("#lastEpisodeId");
			container.empty();

			$("<h4>").text('Cet épisode n\'éxiste pas').appendTo(container);

		});



	// ----------------------------------------------------------------------------------------------------------
	// COUNTER
	// ----------------------------------------------------------------------------------------------------------


	$.ajax({

		method: "GET",
		url: '/ws/episode/counter/months'

	}).done(function(data) {

		var counters = data.counters;

		for (var i = 0; i < counters.length; i++) {

			counter = counters[i];

			var month = counter.monthYYYYMM.substring(4)
			var year = counter.monthYYYYMM.substring(0, 4)

			$('#counterContainerId').append(
				$('<p>')
				.append($('<span>').text(month + ' / ' + year))
				.append($('<span>').addClass('badge badge-primary ml-3').text(counter.downloadTotal))
			);
		}

	});



	// ----------------------------------------------------------------------------------------------------------
	// SESSION STATUS
	// ----------------------------------------------------------------------------------------------------------

	function submitLoginForm() {

		var email = $('#emailInputLogin').val();
		$('#emailInputLogin').val('');

		if (!email || email.trim().length < 3 || email.trim().length > 200) {
			// TODO afficher erreur
			return;
		}

		$.ajax({
			url: '/ws/user/login',
			method: 'POST',
			dataType: 'json',
			processData: false,
			contentType: 'application/json',
			data: JSON.stringify({
				email: email
			})
		}).done(function(data) {

			if (data.ok) {
				$('<div>')
					.addClass("alert alert-success mt-3")
					.attr("role", "alert")
					.text("Utilisez le lien envoyé dans le mail pour vous identifier.")
					.appendTo('#nav-login');
			}
		});
	}

	function drawLoginTab(data) {
		var container = $('#nav-login');
		container.empty();

		if (data.auth) {

			$('<p>').text('Vous êtes identifié').appendTo(container)
			$('<button>')
				.attr('type', 'button')
				.addClass('btn btn-outline-primary')
				.text('Logout')
				.click(function() {
					$.ajax({

						method: "GET",
						url: '/ws/user/logout'

					}).done(function(data) {

						drawLoginTab(data);
					});
				})
				.appendTo(container);

		} else {

			$('<p>').text('Vous n\'êtes pas identifié').appendTo(container)
			$('<form>')
				.append(
					$('<div>')
					.addClass('form-group')
					.append(
						$('<label>').attr('for', 'emailInput').text('Email :')
					)
					.append(
						$('<input>')
						.attr('type', 'text')
						.attr('id', 'emailInputLogin')
						.addClass('form-control border border-danger')
						.on('keypress', function(e) {
							if (e.which == 13) {
								e.preventDefault();
								submitLoginForm();
							}
						})
					)
				)
				.append(
					$('<button>')
					.attr('type', 'button')
					.addClass('btn btn-outline-primary')
					.text('Envoyer')
					.click(function() {
						submitLoginForm();
					})
				)
				.appendTo(container);


			$('#emailInputLogin').focus();
		}
	}

	var token = $.urlParam('token');
	var url = '/ws/user/current'
	if (token) {
		url = '/ws/user/loginback/' + token;
		window.history.pushState("", "", '/');
	}

	$.ajax({

		method: "GET",
		url: url

	}).done(function(data) {
		drawLoginTab(data);
	});




	// ----------------------------------------------------------------------------------------------------------
	// PARTICIPATION FORM
	// ----------------------------------------------------------------------------------------------------------



	var droppedFile = false;

	// Coming from old file input
	$('#fileElem').change(function() {
		var files = $(this)[0].files;

		if (files && files[0]) {

			droppedFile = files[0];
			$('#droppedFilename').text(droppedFile.name);
			$('#formParticipationModal').modal('show');
		}
	});

	var dropArea = $('#dropArea');

	dropArea.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
			e.preventDefault();
			e.stopPropagation();
		})
		.on('dragover dragenter', function() {
			dropArea.addClass('highlight');
		})
		.on('dragleave dragend drop', function() {
			dropArea.removeClass('highlight');
		})
		.on('drop', function(e) {

			droppedFile = e.originalEvent.dataTransfer.files[0];
			$('#droppedFilename').text(droppedFile.name);
			$('#formParticipationModal').modal('show');
		});

	function submitEnd(msg, isErr) {
		$("#postParticipationButton").prop("disabled", false);

		$('#alertSubmitParticipation').removeClass('alert-danger alert-success alert-primary');
		if (isErr) {

			$('#alertSubmitParticipation').addClass('alert-danger');

		} else {

			$('#alertSubmitParticipation').addClass('alert-success');

			droppedFile = false;
			$('#droppedFilename').text('')
			$('#pseudoParticipation').val('');
			$('#titreParticipation').val('');
			$('#descriptionParticipation').val('');
			$('#contactParticipation').val('');
		}

		$('#alertSubmitParticipation').text(msg)
		$('#alertSubmitParticipation').show();
	}

	$('#postParticipationButton').click(function(event) {

		$("#postParticipationButton").prop("disabled", true);

		event.preventDefault();

		if (!droppedFile) {
			submitEnd('Veuillez donner un fichier audio', true)
			return
		}

		var pseudo = $('#pseudoParticipation').val();
		if (!pseudo || pseudo == '') {
			submitEnd('Veuillez donner un pseudo', true)
			return
		}

		var titre = $('#titreParticipation').val();
		if (!titre || titre == '') {
			submitEnd('Veuillez donner un titre', true)
			return
		}

		var data = new FormData();
		data.append("audio", droppedFile);
		data.append("pseudo", pseudo);
		data.append("titre", titre);
		data.append("desc", $('#descriptionParticipation').val());
		data.append("contact", $('#contactParticipation').val());

		$.ajax({
			url: '/ws/episode/',
			method: 'POST',
			dataType: 'json',
			processData: false,
			//contentType: 'multipart/form-data', // DO NOT ! If so, you should give boundary like content-type:multipart/form-data; boundary=... So let the browser do ! Please ! Scrogneugneu
			contentType: false,
			data: data,
			success: function(data) {

				submitEnd('Merci. Votre participation sera publiée rapidement.', false);
			},
			error: function(e) {

				submitEnd('Oups, on a un pb technique !! On corrige ça ! Merci de votre aide.', true);
			}
		});
	});
});