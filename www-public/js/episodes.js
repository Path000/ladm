$(document).ready(function() {

	// ----------------------------------------------------------------------------------------------------------
	// CURRENT USER
	// ----------------------------------------------------------------------------------------------------------


	$.ajax({

		method: "GET",
		url: '/ws/user/current'

	}).done(function(currentUser) {




		// ----------------------------------------------------------------------------------------------------------
		// SCROLL TOP BUTTON
		// ----------------------------------------------------------------------------------------------------------



		$('#goToTopButton').click(function() {
			$('html, body').animate({
				scrollTop: 0
			}, 'slow');
		});


		// ----------------------------------------------------------------------------------------------------------
		// EPISODE COUNTER
		// ----------------------------------------------------------------------------------------------------------



		$.ajax({

			method: "GET",
			url: '/ws/episode/count'

		}).done(function(data) {

			$('#totalEpisodesId').text(data.tatalItems);

		});



		// ----------------------------------------------------------------------------------------------------------
		// LIST EPISODES
		// ----------------------------------------------------------------------------------------------------------

		function pauseAll(that) {
			$("audio").not(that).each(function(index, audio) {
				audio.pause();
			});
			$("video").not(that).each(function(index, video) {
				video.pause();
			});
		}

		function drawEpisodes(data) {

			var container = $("#episodesContainerId");
			var mediaDOM = $('<div>');

			if (data.mediaFileName) {

				if (data.mediaType && data.mediaType.startsWith('audio')) {
					mediaDOM = $('<audio>').css("width", "100%").attr({
						controls: "controls",
						preload: "none",
						src: "/media/episode/" + data.episode
					}).on('play', function() {
						pauseAll(this);
					});
				}

				if (data.mediaType && data.mediaType.startsWith('video')) {
					mediaDOM = $('<video>').css("width", "100%").attr({
						controls: "controls",
						preload: "none",
						src: "/media/episode/" + data.episode
					}).on('play', function() {
						pauseAll(this);
					});
				}
			}

			var bgClass = 'bg-light';

			if (data.status == 'HIDDEN') {

				bgClass = 'bg-secondary';
			}

			$('<div>').addClass('card shadow mt-3 ' + bgClass).append(
				$('<div>').addClass('row no-gutters m-3').append(
					$('<div>').addClass('col-md-4').append(
						$('<img>').attr({
							src: 'img/LADM2017.png'
						}).addClass('card-img img-fluid')
					)
				).append(
					$('<div>').addClass('col-md-8').append(
						$('<div>').addClass('card-body').append(
							$('<h4>').html('Ep ' + data.episode + ' - ' + data.title)
						).append(
							mediaDOM
						).append(
							$('<div>').html(data.description)
						).append(
							$('<p>').html('Par <strong>' + data.author + '</strong>')
						).append(
							$('<p>').append(
								$('<strong>').html("Téléchargements : ").append(
									$('<span>').addClass("badge badge-primary").html(data.downloadTotal)
								)
							)
						).append(
							$('<p>')
							.text('Publié le ')
							.append(
								$('<span>').text((new Date(Date.parse(data.pubDate))).toLocaleDateString('fr-FR', {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "numeric",
									minute: "numeric"
								}))
							)
						).append(
							$('<div>')
							.append(
								$('<input>')
								.attr('type', 'text')
								.attr('readonly', true)
								.addClass('form-control-plaintext')
								.attr('value', 'https://lavis-des-moutons.fr/?episode=' + data.episode)
								.attr('onClick', "this.select();")
							)
						)
						.append(function() {
							if (currentUser.admin) {
								return $('<button>')
									.attr('type', 'button')
									.attr('episode', data.episode)
									.addClass('btn btn-outline-primary mt-3 mr-3')
									.text('Modifier')
									.click(function() {

										$.ajax({
											method: "GET",
											url: '/ws/admin/episode/' + $(this).attr('episode')
										}).done(function(data) {

											showFormEpisode(data);

										});
									});
							}
						})
						.append(function() {
							if (currentUser.admin && data.status == 'PUBLISHED') {
								return $('<button>')
									.attr('type', 'button')
									.attr('episode', data.episode)
									.addClass('btn btn-outline-primary mt-3 mr-3')
									.text('Masquer')
									.click(function() {
										$.ajax({

											method: "GET",
											url: '/ws/admin/hideEpisode/' + $(this).attr('episode')

										}).done(function(data) {

											if (data.ok) {
												reloadEpisodes();
											}

										});
									});
							}
						})
						.append(function() {
							if (currentUser.admin && data.status == 'HIDDEN') {
								return $('<button>')
									.attr('type', 'button')
									.attr('episode', data.episode)
									.addClass('btn btn-success mt-3 mr-3')
									.text('Publier & tweet')
									.click(function() {
										$.ajax({

											method: "GET",
											url: '/ws/admin/showEpisode/' + $(this).attr('episode')

										}).done(function(data) {

											if (data.ok) {
												reloadEpisodes();
											}

										});
									});
							}
						})
						.append(function() {
							if (currentUser.admin && data.status == 'HIDDEN') {
								return $('<button>')
									.attr('type', 'button')
									.attr('episode', data.episode)
									.addClass('btn btn-danger mt-3 mr-3')
									.text('Supprimer')
									.click(function() {

										$.ajax({

											method: "DELETE",
											url: '/ws/admin/episode/' + $(this).attr('episode')

										}).done(function(data) {

											if (data.ok) {
												reloadEpisodes();;
											}

										});
									});
							}
						})
					)
				)
			).appendTo(container);
		}


		// ----------------------------------------------------------------------------------------------------------
		// INFINITE SCROLL
		// ----------------------------------------------------------------------------------------------------------



		function loadPage(page) {
			$.ajax({
				method: "GET",
				url: '/ws/episode/page/' + currentPage
			}).done(function(data) {
				if (data.length > 0) {
					for (var i = 0; i < data.length; i++) {
						drawEpisodes(data[i]);
					}
					currentPage++;
				} else {
					moreToLoad = false;
				}
			});
		}

		var deviceAgent = navigator.userAgent.toLowerCase();
		var agentID = deviceAgent.match(/(iphone|ipod|ipad)/);
		$(window).on('scroll', function() {
			if (($(window).scrollTop() + $(window).height()) == $(document).height() ||
				agentID && ($(window).scrollTop() + $(window).height()) + 150 > $(document).height()) {

				if (moreToLoad) loadPage(currentPage);
			}
		});

		var currentPage = 1;
		var moreToLoad = true;

		function reloadEpisodes() {
			currentPage = 1;
			moreToLoad = true;

			$("#episodesContainerId").empty();

			loadPage(currentPage);
		}

		reloadEpisodes();



		// ----------------------------------------------------------------------------------------------------------
		// ADMIN FEATURES
		// ----------------------------------------------------------------------------------------------------------



		if (!currentUser.admin) return;





		// ----------------------------------------------------------------------------------------------------------
		// LIST OF SOUMISSIONS
		// ----------------------------------------------------------------------------------------------------------





		function drawSoumissions(listItems) {

			var container = $("#soumissionsListContainerId");

			$('<div>').addClass('card shadow bg-warning mt-3').append(
				$('<div>').addClass('row no-gutters m-3').append(
					$('<h3>').text('vvv Soumissions vvv')
				)
			).appendTo(container);

			for (var i = 0; i < listItems.length; i++) {

				data = listItems[i];

				var mediaDOM = $('<div>');

				if (data.fileName) {

					if (data.mimetype.startsWith('video')) {
						mediaDOM = $('<video>').css("width", "100%").attr({
							controls: "controls",
							preload: "none",
							src: "/upload/" + data.fileName
						});

					} else {

						mediaDOM = $('<audio>').css("width", "100%").attr({
							controls: "controls",
							preload: "none",
							src: "/upload/" + data.fileName
						});
					}
				} else {

					mediaDOM.html('Pas de media. (basé sur la présence du filename)')
				}

				var bgClass = 'bg-light';

				if (data.status == 'PUBLISHED') {

					bgClass = 'bg-secondary';
				}

				$('<div>').addClass('card shadow mt-3 ' + bgClass).append(
					$('<div>').addClass('row no-gutters m-3').append(
						$('<div>').addClass('col-md-4').append(
							$('<img>').attr({
								src: 'img/LADM2017.png'
							}).addClass('card-img img-fluid')
						)
					).append(
						$('<div>').addClass('col-md-8').append(
							$('<div>').addClass('card-body')
							.append(
								mediaDOM
							).append(
								$('<div>').html('Id : ' + data._id)
							).append(
								$('<div>').html('Titre : ' + data.title)
							).append(function() {
								var dom = $('<div>').html('Description : ')
								for (var i = 0; i < data.description.length; i++) {
									dom.append($('<div>').text(data.description[i]))
								}
								return dom;
							}).append(
								$('<div>').html('Auteur : ' + data.author)
							).append(
								$('<div>').html('Contact : ' + data.contact)
							).append(
								$('<div>').html('Taille : ' + data.size)
							).append(
								$('<div>').html('Type : ' + data.mimetype)
							).append(
								$('<div>').html('Origine : ' + data.origin)
							).append(
								$('<p>')
								.text('Posté le ')
								.append(
									$('<span>').text((new Date(Date.parse(data.postDate))).toLocaleDateString('fr-FR', {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "numeric",
										minute: "numeric"
									}))
								)
							).append(
								$('<button>')
								.attr('type', 'button')
								.attr('soumissionId', data._id)
								.addClass('btn btn-outline-primary mr-3')
								.text('Publier')
								.click(function() {
									$.ajax({

										method: "GET",
										url: '/ws/admin/soumission/id/' + $(this).attr('soumissionId')

									}).done(function(data) {

										showFormSoumission(data);

									});
								})
							).append(
								$('<button>')
								.attr('type', 'button')
								.attr('soumissionId', data._id)
								.addClass('btn btn-outline-primary mr-3')
								.text('Supprimer')
								.click(function() {
									$.ajax({

										method: "DELETE",
										url: '/ws/admin/soumission/' + $(this).attr('soumissionId')

									}).done(function(data) {

										if (data.ok) {
											refreshSoumissionsList();
										}

									});
								})
							)
						)
					)
				).appendTo(container);
			}

			$('<div>').addClass('card shadow bg-warning mt-3').append(
				$('<div>').addClass('row no-gutters m-3').append(
					$('<h3>').text('vvv Participations vvv')
				)
			).appendTo(container);


		}

		function refreshSoumissionsList() {
			$.ajax({

				method: "GET",
				url: '/ws/admin/soumission/list/'

			}).done(function(data) {

				$("#soumissionsListContainerId").empty();

				if (data.length > 0) {

					drawSoumissions(data);
				}

			});
		}

		refreshSoumissionsList();






		// ----------------------------------------------------------------------------------------------------------
		// FORM MODIFIER
		// ----------------------------------------------------------------------------------------------------------

		function resetFormEpisode() {

			$('#formEpisodeId').attr('episode', '');
			$('#auteurParticipation').val('');
			$('#titreParticipation').val('');
			$('#descriptionParticipation').val('');
		}

		function showFormEpisode(data) {

			resetFormEpisode();

			$('#formEpisodeId').attr('episode', data.episode);
			$('#auteurParticipation').val(data.author);
			$('#titreParticipation').val(data.title);
			$('#descriptionParticipation').val(data.description);

			$('#modifierFormEpisodeModal').modal('show');
		}

		$('#postParticipationButton').click(function() {

			$.ajax({

				url: '/ws/admin/episode/' + $('#formEpisodeId').attr('episode'),
				method: 'PUT',
				dataType: 'json',
				processData: false,
				contentType: 'application/json',
				data: JSON.stringify({
					author: $('#auteurParticipation').val(),
					title: $('#titreParticipation').val(),
					description: $('#descriptionParticipation').val()
				})
			}).done(function(data) {

				if (data.ok) {

					$('#modifierFormEpisodeModal').modal('hide');
					//  reloadEpisodes();
				}

			});

		});




		// ----------------------------------------------------------------------------------------------------------
		// FORM SOUMISSION
		// ----------------------------------------------------------------------------------------------------------

		function resetFormSoumission() {
			$('#formSoumissionId').attr('soumissionId', '');
			$('#episodeSoumission').val('');
			$('#auteurSoumission').val('');
			$('#titreSoumission').val('');
			$('#descriptionSoumission').val('');
		}

		function showFormSoumission(data) {
			resetFormSoumission();
			$('#formSoumissionId').attr('soumissionId', data._id);
			$('#episodeSoumission').val('');
			$('#auteurSoumission').val(data.author);
			$('#titreSoumission').val(data.title);
			var desc = '';
			for (var i = 0; i < data.description.length; i++) {
				desc += data.description[i] + '\n';
			}
			$('#descriptionSoumission').val(desc);

			$('#publierFormSoumissionModal').modal('show');
		}

		$('#postSoumissionButton').click(function() {

			$.ajax({

				url: '/ws/admin/publish/' + $('#formSoumissionId').attr('soumissionId'),
				method: 'PUT',
				dataType: 'json',
				processData: false,
				contentType: 'application/json',
				data: JSON.stringify({
					episode: $('#episodeSoumission').val(),
					author: $('#auteurSoumission').val(),
					title: $('#titreSoumission').val(),
					description: $('#descriptionSoumission').val()
				})
			}).done(function(data) {

				$('#publierFormSoumissionModal').modal('hide');

			});

		});





		// ----------------------------------------------------------------------------------------------------------
		// ADMIN BUTTONS
		// ----------------------------------------------------------------------------------------------------------





		$("#adminButtonsContainerId")
			.append(
				$('<button>')
				.addClass('btn btn-outline-primary my-3 mr-3')
				.attr('role', 'button')
				.text('Générer RSS')
				.click(function() {

					$('#checkMailResultId').text('');

					$.ajax({

						method: "GET",
						url: '/ws/admin/genRSS'

					}).done(function(data) {

						if (data.ok) {
							$('#checkMailResultId').text('RSS généré.');
						}

					});
				})
			).append(
				$('<button>')
				.addClass('btn btn-outline-primary my-3 mr-3')
				.attr('role', 'button')
				.text('Backup DB')
				.click(function() {

					$('#checkMailResultId').text('');

					$.ajax({

						method: "GET",
						url: '/ws/admin/backupDB'

					}).done(function(data) {

						if (data.ok) {
							$('#checkMailResultId').text('DB saved.');
						}

					});
				})
			).append(
				$('<button>')
				.addClass('btn btn-outline-primary my-3 mr-3')
				.attr('role', 'button')
				.text('Lire boite mail')
				.click(function() {

					$('#checkMailResultId').text('');

					$.ajax({

						method: "GET",
						url: '/ws/admin/checkMail'

					}).done(function(data) {

						if (data.nb > 0) {

							$('#checkMailResultId').text(data.nb + ' nouveau(x) message(s).');
							refreshSoumissionsList();
						} else {
							$('#checkMailResultId').text('Pas de nouveau message.');
						}

					});
				})
			).append(
				$('<span>').attr('id', 'checkMailResultId')
			);





	}); // end of get current user

}); // end of document ready