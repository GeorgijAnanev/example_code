$().ready(function () {
    /**
     * загрузка картинок в clickbuilder
     */
    $('#fileInput').change(function () {
        var fd = new FormData();
        fd.append('file', $('#image-upload')[0][1].files[0]);
        $('#ajax_loader').fadeIn();
        $('.error').fadeOut();

        $.ajax({
            type: 'POST',
            url: '?r=clickbuilder/landingpages/uploadsimple&render=image',
            data: fd,
            processData: false,
            contentType: false,
            dataType: "text",
            success: function (data) {
                var json = JSON.parse(data);
                if (json.status == 'error') {
                    $('#ajax_loader').hide();
                    $('.error').html(json.message).fadeIn(1000);
                }
                else {
                    var content = json.content;
                    $('#ajax_loader').fadeOut();
                    $('#lb-my-images').append(content);

                    refresh();
                }
            },
            error: function (data) {
                console.log(data);
            }
        });
        $('#fileInput').val('');

        return false;
    });


    /**
     * Ресайз для просмотра шаблона в попапе
     */
    window.widgetResizeCallback = function (w, h) {
        var els = $(".widget-modal, .widget-modal .modal-body, .widget-modal iframe");
        w = w || 705;
        $(".widget-modal").css({
            "margin-top": -(h / 2),
            "margin-left": -(w / 2)
        });
        els.width(w);
        els.height(h);
    };

    window.widgetCloseCallback = function (is_editor) {
        if (is_editor)
            $("#lp-form-editor").fadeOut("fast");
        else {
            $(".widget-modal").modal("hide");
        }
    };

    // Событие когда закрывается модальная форма публикации
    $('#lp-publish-modal').on('hidden', function () {
        $('ul.nav [data-action=publish]').removeClass('btn-warning active');
        //$('#lp-publish-modal').hide();
    })

    window.formChangedCallback = function (form_id) {
        Editor.optin_form_id = form_id;
    };
    window.markChangedCallback = Editor.markChange;
    Editor.return_false = function () {
        return false;
    };

    /**
     * Ресайз редактора
     */
    $(window).on("resize", function () {
        var width = $(this).width(),
            height = $(this).height();
        $("#lp-form-editor").width(width).height(height - 40);
        $("iframe").each(function () {
            try {
                if (this.contentWindow.mainWindowResizeCallback)
                    this.contentWindow.mainWindowResizeCallback();
            } catch (e) {
            }
        });
    }).trigger("resize");


    /**
     * редактирование названия страницы и URL
     */
    var simpleNameChanged = function (e) {
        var name = $('#id_page_name').val();
        if (!Editor.edit) {
            var url = Editor.cleanPageSimpleName(name);
            $('#id_page_url').val(url);
            $('#id_page_url-span').text(url);
        }

        $('#lp-page-menu-title').text(name);
        Editor.markChange();
        Editor.name_changed = true;
        if (e.type === "keyup" && e.keyCode === 13) {
            $(this).blur();
        }
    };

    // название страницы
    $('#id_page_name').change(simpleNameChanged); // онлайн редактирование названия страницы при потере фокуса
    $('#id_page_name').keydown(simpleNameChanged); // онлайн редактирование названия страницы при нажатой клавише
    $('#id_page_name').keyup(simpleNameChanged); // онлайн редактирование названия страницы при отжатой клавише

    // slug страницы
    $('#id_page_url').change(Editor.markChange); // онлайн редактирование URL при потере фокуса
    $('#id_page_url').keydown(Editor.markChange); // онлайн редактирование URL при при нажатой клавише
    $('#id_page_url').keyup(function (e) { // онлайн редактирование URL при при отжатой клавише
        Editor.markChange();
        if (e.keyCode === 13) {
            $(this).blur();
        }
    });

    $('#id_page_url').blur(function () {
        $(this).val(Editor.cleanPageSimpleName($(this).val()));
    });

    $(window).resize(Editor.windowResize); // загрузка ресайза


    /**
     * Загрузка форм
     * Загрузка файлов
     * Загрузка картинок
     */
    $(window).load(function () {
        setTimeout(function () {
            Editor.checkIntegrationLoadedStatus();
            Editor.loadBribeMailFiles();
            Editor.loadAWeberForms(false);
            Editor.loadMailChimpForms(false);
            Editor.loadIContactForms(false);
            Editor.loadInfusionsoftForms(false);
            Editor.loadGetresponseForms(false);
            Editor.loadGoToWebinarWebinars(false);
            Editor.loadConstantContactForms(false);
        }, 50);

        Editor.loadPictures(null, null);

        $(window).on('beforeunload', function () {
            if (Editor.change_made) {
                return "Are you sure you want to leave without saving?";
            }
        });
    });

    // редактирование название страницы
    $("a[data-edit-span]").each(function () {
        var button = $(this);
        var id = button.attr("data-edit-span");
        var inputEl = $("#" + id);
        var spanEl = $("#" + id + "-span");
        var onClick = function () {
            if (spanEl.is(":visible")) {
                inputEl.css("width", 100);
                spanEl.hide();
                inputEl.show();
                inputEl.focus();
                button.addClass("active");
            } else {
                inputEl.blur();
            }
        };
        inputEl.blur(function () {
            var text = inputEl.val();
            if (text.length > 30) {
                text = text.substr(0, 30);
                spanEl.text(text);
                spanEl.html(spanEl.html() + "&hellip;");
            } else {
                spanEl.text(text);
            }
            inputEl.hide();
            spanEl.show();
            button.removeClass("active");
        });
        button.click(onClick);
        spanEl.click(onClick);
    });


    /**
     * Предпросмотр шаблона
     */
    $("li[data-state] > button").each(function () {
        var button = $(this);
        var confirmationText = "You must save the page before you can preview it. Would you like to do this now?";
        button.click(function () {
            $("li[data-state] > button").removeAttr("class").addClass("btn");
            button.addClass(button.attr("data-active-class"));
            button.addClass("active");

            switch (button.attr("data-state")) {
                case "edit":
                    $("#preview-iframe-wrapper").remove();
                    $("#preview-iframe").remove();
                    $("#remove-preview").hide();
                    $("#lp-top-navigation").show();
                    break;
                case "preview":
                    if (!Editor.edit || Editor.change_made) {
                        if (!confirm(confirmationText)) {
                            $("li[data-state] > button[data-state=edit]").click();
                            return;
                        }
                        Editor.loadPreview();
                        Editor.uiSave(function (success) {
                            if (success) {
                                Editor.loadPreview();
                            } else {
                                $("li[data-state] > button[data-state=edit]").click();
                            }
                        });
                    } else {
                        Editor.loadPreview();
                    }
                    break;
            }
        });
    });


    // Выход
    $(".quit-button").click(function (e) {
        e.preventDefault();
        var anchor = $(this);
        if (Editor.change_made && confirm("Save changes?")) {
            Editor.saveIt();
        }
        setTimeout(function () {
            window.onbeforeunload = null;
            window.location = anchor.attr("href");
        }, 500);
    });


    /**
     * Get height and  width
     */
    var navHeight = $("#lp-top-navigation").height();
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();


    /**
     * Сохранение
     * Публикация
     * Аналитика
     */
    $("li[data-action] > button").each(function () {
        var button = $(this);
        var confirmationText = "You must save the page before you can publish it. Would you like to do this now?";
        var confirmationText2 = "Would you like to save your page before you publish it?";
        var activate = function () {
            if (button.attr("data-active-class")) {
                button.addClass(button.attr("data-active-class"));
                button.addClass("active");
            }
        };
        var deactivate = function () {
            button.removeClass(button.attr("data-active-class"));
            button.removeClass("active");
        };

        button.click(function () {
            $("li[data-action] > button").removeAttr("class").addClass("btn");
            $("button#save-button").addClass("btn-primary");
            activate();

            switch (button.attr("data-action")) {

                case "save":
                    Editor.uiSave();
                    break;

                case "analytics":
                    window.location.href = button.attr("data-href");
                    break;

                case "publish":
                    if (!Editor.edit) {
                        if (!confirm(confirmationText)) {
                            deactivate();
                            return;
                        }
                        Editor.uiSave(function (success) {
                            if (success) {
                                var publishUrl = "/my-page/" + Editor.template_id + "/publish";
                                $("#lp-publish-modal iframe").attr("src", publishUrl);
                                $("#lp-publish-modal").css("border", "none");
                                var frame = $("#lp-publish-modal").modal("show").find("iframe")[0];
                                if (frame.contentWindow.callOnResizeCb)
                                    frame.contentWindow.callOnResizeCb();
                            } else {
                                deactivate();
                            }
                        });
                    }
                    else {
                        if (Editor.change_made && confirm(confirmationText2)) {
                            Editor.uiSave(function (success) {
                                if (success) {
                                    var frame = $("#lp-publish-modal").modal("show").find("iframe")[0];
                                    if (frame.contentWindow.callOnResizeCb)
                                        frame.contentWindow.callOnResizeCb();
                                } else {
                                    deactivate();
                                }
                            });
                        } else {
                            var frame = $("#lp-publish-modal").modal("show").find("iframe")[0];
                            if (frame.contentWindow.callOnResizeCb)
                                frame.contentWindow.callOnResizeCb();
                        }
                    }
                    break;
            }
        });
    });

    Editor.windowResize();

});


var def_exit_message = 'Are you sure you want to leave this page?\n';
def_exit_message += '**********************************************\n';
def_exit_message += '\n';
def_exit_message += ' W A I T   B E F O R E   Y O U   G O !\n';
def_exit_message += '\n';
def_exit_message += ' CLICK THE *Stay on this page* BUTTON OR\n';
def_exit_message += ' THE *CANCEL* BUTTON RIGHT NOW\n';
def_exit_message += ' TO RECEIVE (insert your exit offer here)\n';
def_exit_message += ' GET IT HERE FOR FREE!\n';
def_exit_message += '\n';
def_exit_message += '**********************************************\n';
var Editor = {
    loadedBribeMailFiles: false,
    loadedAWeberForms: false,
    loadedMailChimpForms: false,
    loadedIContactForms: false,
    loadedInfusionsoftForms: false,
    loadedGetresponseForms: false,
    loadedGoToWebinarWebinars: false,
    loadedConstantContactForms: false,
    different_simple_name: false,
    saving: false,
    change_made: false,
    edit: false,
    iframe: null,
    openingEditWindow: false,
    nowEditingElement: false,
    aweber_copy_paste: false,
    edit_data: {},
    color_data: {},
    font_data: {},
    font_options_str: '',
    page_title: '',
    page_keywords: '',
    page_description: '',
    user_analytics_code: '',
    user_head_code: '',
    target_url: null,
    target_page: null,
    exit_popup: false,
    exit_popup_message: def_exit_message,
    exit_popup_redirect: false,
    exit_popup_redirect_url: '',
    iframe_top_position: 0,
    js_variables: {},
    template_js_variables: {},
    changeble_elements: {},
    changable_colors: {},
    richtext_timeout: null,
    changable_fonts: {},
    submitFormListener: function () {},
    closeEditorListener: function () {},
    selectImage: function () {},
    cleanAndSetBasicRichText: function () {},
    cleanAndSetRichTextArea: function () {},
    template_id: null,
    player_logo_url: {
        'empty': '',
        'lp': ''
    },
    selected_element_id: null,
    selected_form_id: null,
    selected_form_optin: null,
    selected_form_optin_type: null,
    private_template: false,
    public_page_url: false,
    template_name: false,
    name_changed: false,
    is_initial: false,
    is_test: false,
    is_control: false,
    is_running: false,
    is_variation: false,
    editor_blocks_by_type: {
        'opt-in-form': '',
        'image': 'lp-change-img',
        'link': 'lp-change-link',
        'submit': 'lp-edit-btn-text',
        'fadin-box': 'lp-edit-optin-box',
        'embed-area': 'lp-edit-area',
        'text_input': 'lp-edit-placeholder',
        'text': '',
        'richtext-area': 'lp-edit-richtext-area'
    },
    first_name_available: ['aweber', 'officeautopilot', 'sendreach', 'shoppingcart', 'mailchimp', 'icontact', 'getresponse', 'infusionsoft', 'constantcontact', 'gotowebinar'],
    sales_path: null,
    service_integration: null,
    service_list: null,
    sales_path_custom_redirect: false,


    /**
     * URL страницы
     */
    defaultDiacriticsRemovalMap: function () {
        return [
            {
                'base': 'A',
                'letters': /[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g
            },
            {'base': 'AA', 'letters': /[\uA732]/g},
            {'base': 'AE', 'letters': /[\u00C6\u01FC\u01E2]/g},
            {'base': 'AO', 'letters': /[\uA734]/g},
            {'base': 'AU', 'letters': /[\uA736]/g},
            {'base': 'AV', 'letters': /[\uA738\uA73A]/g},
            {'base': 'AY', 'letters': /[\uA73C]/g},
            {'base': 'B', 'letters': /[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
            {'base': 'C', 'letters': /[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
            {
                'base': 'D',
                'letters': /[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g
            },
            {'base': 'DZ', 'letters': /[\u01F1\u01C4]/g},
            {'base': 'Dz', 'letters': /[\u01F2\u01C5]/g},
            {
                'base': 'E',
                'letters': /[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g
            },
            {'base': 'F', 'letters': /[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
            {
                'base': 'G',
                'letters': /[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g
            },
            {
                'base': 'H',
                'letters': /[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g
            },
            {
                'base': 'I',
                'letters': /[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g
            },
            {'base': 'J', 'letters': /[\u004A\u24BF\uFF2A\u0134\u0248]/g},
            {
                'base': 'K',
                'letters': /[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g
            },
            {
                'base': 'L',
                'letters': /[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g
            },
            {'base': 'LJ', 'letters': /[\u01C7]/g},
            {'base': 'Lj', 'letters': /[\u01C8]/g},
            {'base': 'M', 'letters': /[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
            {
                'base': 'N',
                'letters': /[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g
            },
            {'base': 'NJ', 'letters': /[\u01CA]/g},
            {'base': 'Nj', 'letters': /[\u01CB]/g},
            {
                'base': 'O',
                'letters': /[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g
            },
            {'base': 'OI', 'letters': /[\u01A2]/g},
            {'base': 'OO', 'letters': /[\uA74E]/g},
            {'base': 'OU', 'letters': /[\u0222]/g},
            {'base': 'P', 'letters': /[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
            {'base': 'Q', 'letters': /[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
            {
                'base': 'R',
                'letters': /[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g
            },
            {
                'base': 'S',
                'letters': /[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g
            },
            {
                'base': 'T',
                'letters': /[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g
            },
            {'base': 'TZ', 'letters': /[\uA728]/g},
            {
                'base': 'U',
                'letters': /[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g
            },
            {'base': 'V', 'letters': /[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
            {'base': 'VY', 'letters': /[\uA760]/g},
            {'base': 'W', 'letters': /[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
            {'base': 'X', 'letters': /[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
            {
                'base': 'Y',
                'letters': /[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g
            },
            {
                'base': 'Z',
                'letters': /[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g
            },
            {
                'base': 'a',
                'letters': /[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g
            },
            {'base': 'aa', 'letters': /[\uA733]/g},
            {'base': 'ae', 'letters': /[\u00E6\u01FD\u01E3]/g},
            {'base': 'ao', 'letters': /[\uA735]/g},
            {'base': 'au', 'letters': /[\uA737]/g},
            {'base': 'av', 'letters': /[\uA739\uA73B]/g},
            {'base': 'ay', 'letters': /[\uA73D]/g},
            {'base': 'b', 'letters': /[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
            {
                'base': 'c',
                'letters': /[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g
            },
            {
                'base': 'd',
                'letters': /[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g
            },
            {'base': 'dz', 'letters': /[\u01F3\u01C6]/g},
            {
                'base': 'e',
                'letters': /[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g
            },
            {'base': 'f', 'letters': /[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
            {
                'base': 'g',
                'letters': /[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g
            },
            {
                'base': 'h',
                'letters': /[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g
            },
            {'base': 'hv', 'letters': /[\u0195]/g},
            {
                'base': 'i',
                'letters': /[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g
            },
            {'base': 'j', 'letters': /[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
            {
                'base': 'k',
                'letters': /[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g
            },
            {
                'base': 'l',
                'letters': /[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g
            },
            {'base': 'lj', 'letters': /[\u01C9]/g},
            {'base': 'm', 'letters': /[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
            {
                'base': 'n',
                'letters': /[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g
            },
            {'base': 'nj', 'letters': /[\u01CC]/g},
            {
                'base': 'o',
                'letters': /[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g
            },
            {'base': 'oi', 'letters': /[\u01A3]/g},
            {'base': 'ou', 'letters': /[\u0223]/g},
            {'base': 'oo', 'letters': /[\uA74F]/g},
            {'base': 'p', 'letters': /[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
            {'base': 'q', 'letters': /[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
            {
                'base': 'r',
                'letters': /[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g
            },
            {
                'base': 's',
                'letters': /[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g
            },
            {
                'base': 't',
                'letters': /[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g
            },
            {'base': 'tz', 'letters': /[\uA729]/g},
            {
                'base': 'u',
                'letters': /[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g
            },
            {'base': 'v', 'letters': /[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
            {'base': 'vy', 'letters': /[\uA761]/g},
            {'base': 'w', 'letters': /[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
            {'base': 'x', 'letters': /[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
            {
                'base': 'y',
                'letters': /[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g
            },
            {
                'base': 'z',
                'letters': /[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g
            }
        ];
    },

    /**
     * онлайн редактирование (изменение) данных в iframe
     */
    changeEditor: function (data) {
        alert(data);
    },

    /**
     * Загрузка данных
     */
    loadData: function (url, template_id, template_js_variables, edit, private_template, public_page_url, template_name) {
        Editor.private_template = private_template;
        Editor.public_page_url = public_page_url;
        Editor.template_name = template_name;
        Editor.user_analytics_code = $('#id-lp-analytics').val();
        Editor.user_head_code = $('#id-lp-head-code').val();
        Editor.template_js_variables = template_js_variables;
        Editor.template_id = template_id;
        Editor.player_logo_url = player_logo_urls;
        Editor.page_title = $('#id-page-title').val();
        Editor.page_keywords = $('#id-page-keywords').val();
        Editor.page_description = $('#id-page-description').val();

        if (edit) {
            Editor.edit = true;
            API.apiCall({
                data: {
                    'request': 'page-data'
                },
                type: 'POST',
                url: window.location.href,
                async: true,
                success: function (data) {
                    var page_data = data.body;
                    Editor.edit_data = page_data['edit_data'];
                    if (page_data['color_data']) {
                        Editor.color_data = page_data['color_data'];
                    }
                    if (page_data['font_data']) {
                        Editor.font_data = page_data['font_data'];
                    }
                    if (page_data['js_variables_data']) {
                        Editor.js_variables = page_data['js_variables_data'];
                    }
                    Editor.bribemail = page_data["bribemail"];
                    Editor.form = page_data["form"];
                    Editor.afterLoadData(url);
                }
            });
            Editor.target_url = $('#target-url').val();
            Editor.target_page = $('#lp-target-page-id').val();
            Editor.exit_popup = $('#id-exit-popup').is(':checked');
            Editor.exit_popup_message = $('#id-exit-popup-message').val();
            Editor.exit_popup_redirect = $('#id-exit-popup-redirect').is(':checked');
            Editor.exit_popup_redirect_url = $('#id-exit-popup-redirect-url').val();
            var queryString = document.location.href.match(/(.*)#!(.*)/);
            var queryParameters = {};
            if (queryString !== null) {
                var pairs = queryString[2].split("&");
                for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i].split("=");
                    queryParameters[pair[0]] = pair[1];
                }
            }
            if ("add-variation" in queryParameters) {
                $("#lp-add-variation-modal").modal("show");
            }
        } else {
            Editor.afterLoadData(url);
        }
    },

    /**
     * Загрузка данных в iframe
     */
    afterLoadData: function (url) {
        Editor.iframe = $('<iframe>', {
            'src': url,
            'id': 'lp-template-iframe',
            'noresize': 'noresize',
            'frameborder': '0',
            'height': ($(window).outerHeight() - $('#lp-top-navigation').outerHeight() + 7)
        }).load(function () {
            Editor.afterTemplateLoaded();
            Editor.iframe_top_position = $('#lp-template-iframe').offset().top;
        }).appendTo('#lp-iframe-wrapper');

        Editor.iframe.hide();

        $('#basic-page-settings').click(function () {
            Editor.openSEOSettings();
            return false;
        });

        /*
         $('#exit-popup-settings').click(function () {
         Editor.openExitPopupSettings();
         return false;
         });
         $('#target-page-settings').click(function () {
         Editor.openTargetPageSettings();
         return false;
         });
         $('#target-url-settings').click(function () {
         Editor.openTargetURLSettings();
         return false;
         });
         */
        $('#tracking-code-settings').click(function () {
            Editor.openTrackingCodeSettings();
            return false;
        });

        $('#style-settings').click(function () {
            Editor.openStyleSettings();
            return false;
        });
        Editor.setListeners();
    },

    basicRichTextChangedResize: function () {
        if ($('#lp-edit-rich-text .redactor_editor').get(0)) {
            var height = 0;
            $('#lp-edit-rich-text .redactor_editor > *').each(function () {
                height += $(this).outerHeight(true);
            });
            height += ($('#lp-edit-rich-text .redactor_toolbar').outerHeight(true) + $('#lp-modal-header').outerHeight(true) + $('#lb-submit-btns hr').outerHeight(true) + $('#lb-submit-btns').outerHeight(true) + 120);
            if ($('#lp-removable-elem').is(':visible')) {
                height += $('#lp-removable-elem').outerHeight(true);
            }
            if ($('#lp-editor').height() <= (height)) {
                var editor_space_height = $('#lp-editor').height();
                editor_space_height -= ($('#lp-edit-rich-text .redactor_toolbar').outerHeight(true) + $('#lp-modal-header').outerHeight(true) + $('#lb-submit-btns hr').outerHeight(true) - $('#lb-submit-btns').outerHeight(true) + 120);
                if ($('#lp-removable-elem').is(':visible')) {
                    editor_space_height -= $('#lp-removable-elem').outerHeight(true);
                }
                $('#lp-edit-rich-text .redactor_editor').height(editor_space_height);
            } else {
                $('#lp-edit-rich-text .redactor_editor').css('height', 'auto');
            }
        }
    },

    richTextChangedResize: function () {
        if ($('#lp-edit-richtext-area .redactor_editor').get(0)) {
            var height = 0;
            $('#lp-edit-richtext-area .redactor_editor > *').each(function () {
                height += $(this).outerHeight(true);
            });
            height += ($('#lp-edit-richtext-area .redactor_toolbar').outerHeight(true) + $('#lp-modal-header').outerHeight(true) + $('#lb-submit-btns hr').outerHeight(true) + $('#lb-submit-btns').outerHeight(true) + 120);
            if ($('#lp-removable-elem').is(':visible')) {
                height += $('#lp-removable-elem').outerHeight(true);
            }
            if ($('#lp-editor').height() <= (height)) {
                var editor_space_height = $('#lp-editor').height();
                editor_space_height -= ($('#lp-edit-richtext-area .redactor_toolbar').outerHeight(true) + $('#lp-modal-header').outerHeight(true) + $('#lb-submit-btns hr').outerHeight(true) - $('#lb-submit-btns').outerHeight(true) + 120);
                if ($('#lp-removable-elem').is(':visible')) {
                    editor_space_height -= $('#lp-removable-elem').outerHeight(true);
                }
                $('#lp-edit-richtext-area .redactor_editor').height(editor_space_height);
            } else {
                $('#lp-edit-richtext-area .redactor_editor').css('height', 'auto');
            }
        }
    },

    /**
     * изменение текста
     */
    basicRichTextChanged: function () {
        Editor.cleanAndSetBasicRichText();
        Editor.basicRichTextChangedResize();
    },

    /*
     * Перерисовка ширины и высоты шаблона
     */
    windowResize: function () {
        if (Editor.iframe) {
            if ($("#lp-top-navigation").is(":visible")) {
                Editor.iframe.height($(window).height() - $('#lp-top-navigation').height() + 7);
            } else {
                Editor.iframe.height($(window).height());
            }
        }
        var templete_settings_width = (($('#templete-settings').attr('data-hidden') === 'true') ? 0 : $('#templete-settings').width());
        $('#lp-iframe-wrapper').height($(window).height() - $('#lp-top-navigation').height() + 5);
        $('#lp-iframe-wrapper').width($(window).width() - templete_settings_width);
        $('#lp-iframe-wrapper').css('padding-left', templete_settings_width + 'px');
        $('#templete-settings').height($(window).height() - $('#lp-top-navigation').outerHeight(true) - 5);
        $('#white-box-left').height($(window).height() - $('#lp-top-navigation').outerHeight(true) - 20);
        $('#lp-editor').height($('#white-box-left').height());
        var e_elem_height = $(window).height() - $('#lp-top-navigation').outerHeight(true) - $('#lp-page-menu-title').outerHeight(true) - $('#white-box-left hr').outerHeight(true) - $('#save-btn-space').outerHeight(true);
        $('#editable-elements').height(e_elem_height);
        $('#lp-hide-editor-button').height($('#lp-iframe-wrapper').height());
        Editor.basicRichTextChangedResize();
        Editor.richTextChangedResize();
    },

    /**
     * фоновая загрузка картинок
     */
    loadPictures: function (id, url) {
        if (id && url) {
            Editor.selectImage(null, url, id);
        }
        $('#images-loader').show();

        // запрос на загрузку картинок
        Editor.loadPicturesHandler(true, null);
    },

    /**
     * ajax запрос на загрузку картинок
     */
    loadPicturesHandler: function (first_time, cstr) {
        API.apiCall({
            data: {
                'cstr': cstr
            },
            method: 'loadimages',
            type: 'GET',
            async: true,
            success: function (data) {
                if (first_time) {
                    $('#lb-my-images .my-images').remove();
                }
                for (var i in data.body.images) {
                    $('#lb-my-images').append($('<li class="my-images">').html('<a href="#" class="image-choose-btn" onclick="Editor.selectImage(this, \'' + '../../' + data.body.images[i]['original_url'] + '\',' + data.body.images[i]['id'] + ');return false;"><img src="' + data.body.images[i]['thumbnail_url'] + '" alt="Image"></a>'));
                }
                if (data.body.has_more) {
                    Editor.loadPicturesHandler(false, data.body.cstr);
                } else {
                    $('#images-loader').hide();
                }
            },
            error: function () {
                $('#images-loader').hide();
            }
        });
    },

    /**
     * Загрузка шаблона
     */
    afterTemplateLoaded: function () {
        Editor.setFonts(); // загрузка шрифтов
        Editor.setEditableText(); // парсинг только что вставленного фрейма, инициализация левого сайдбара
        Editor.setChangebleStyle();

        Editor.iframe.contents().scroll(function () {
            Editor.moveElementBorder();
        });

        Editor.windowResize();

        $("#templete-settings").resizable({
            handles: 'e',
            minWidth: 270,
            iframeFix: true,
            resize: function (event, ui) {
                var frame = $("#lp-form-editor")[0].contentWindow;
                if (frame && frame.resizeSidebar)
                    frame.resizeSidebar($(this).width());
                Editor.windowResize();
            },
            start: function (event, ui) {
                $('iframe').css('pointer-events', 'none');
            },
            stop: function (event, ui) {
                $('iframe').css('pointer-events', 'auto');
            }
        });

        Editor.iframe.contents().find('form').submit(Editor.return_false);
        Editor.iframe.contents().find('a').click(function (e) {
            e.preventDefault();
        });
        Editor.iframe.contents().find('label').click(Editor.return_false);
    },

    /**
     *
     */
    moveElementBorder: function () {
        $('.lb-border-element').each(function () {
            var $this = $(this);
            $this.css('top', (parseFloat($this.attr('data-lb-top')) + Editor.iframe_top_position - Editor.iframe.contents().scrollTop()) + 'px');
        });
    },


    /*****************************************************************************************************************  */
    /******************************************  INTEGRATION FORM ****************************************************  */
    /*****************************************************************************************************************  */
    loadMailChimpForms: function (reset) {
        var data = {
            'request': 'mailchimp-forms'
        };
        if (reset) {
            $('#lb-reload-btn-mailchimp').hide();
            $('#lb-mailchimp-forms-select').hide();
            $('#lb-mailchimp-loading').show();
            data['reset'] = 'y';
        }
        API.apiCall({
            data: data,
            type: 'GET',
            async: true,
            success: function (data) {

                if (data.status == '200') {
                    $('#lb-mailchimp-forms-select').empty();
                    $('#lb-mailchimp-forms-select').append($('<option class="muted" value="">----</option>'));

                    for (var i in data.body) {
                        var form = data.body[i];
                        $('#lb-mailchimp-forms-select').append($('<option value="' + form['id'] + '">' + form['name'] + '</option>'));
                    }

                    // получаем из запроса значение для списка `Choose your desired lists`
                    var active = data.active;
                    // и устанавливаем это значение
                    $('#lb-mailchimp-forms-select').val(active);

                    $('#lb-reload-btn-mailchimp').show();
                    $('#lb-mailchimp-forms-select').show();
                    $('#lb-mailchimp-loading').hide();
                    AVAILABLE_SERVICES['mailchimp'] = true;
                }
                else if (data.status == '201') {
                    $('#lb-mailchimp-forms').html('<div class="alert alert-info">First you need to <b><a href="' + data.body + '">setup your MailChimp</a></b> account.</div>');
                }
                else if (data.status == '202') {
                    if (!$('#lb-mailchimp-loading').is('visible')) {
                        $('#lb-reload-btn-mailchimp').hide();
                        $('#lb-mailchimp-loading').show();
                        $('#lb-mailchimp-forms-select').hide();
                    }
                    setTimeout(function () {
                        Editor.loadMailChimpForms(false);
                    }, 3000);
                }

                Editor.loadedMailChimpForms = true;
                Editor.checkIntegrationLoadedStatus();
            }
        });
    },

    firstNameCheckboxChanged: function () {
        if (!Editor.selected_form_id) {
            return;
        }
        var show = (Editor.checkIfCanShowFirstName() && $('#lp-use-first-name-checkbox').is(':checked')) ? true : false;
        Editor.showHideFirstName(show);
    },

    showHideFirstNameOption: function () {
        if (Editor.checkIfCanShowFirstName()) {
            $('#lp-use-first-name-form').show();
            var show = (Editor.checkIfCanShowFirstName() && $('#lp-use-first-name-checkbox').is(':checked')) ? true : false;
            Editor.showHideFirstName(show);
        } else {
            $('#lp-use-first-name-form').hide();
            Editor.showHideFirstName(false);
        }
    },

    showHideSalesPathOption: function (show_redirect_url) {
        if (show_redirect_url) {
            $('#lp-sales-page').show();
        } else {
            $('#lp-sales-page').hide();
        }
    },

    saveFirstName: function () {
        Editor.changeble_elements[Editor.selected_form_id]['use-name'] = (Editor.checkIfCanShowFirstName() && $('#lp-use-first-name-checkbox').is(':checked')) ? true : false;
    },

    showHideFirstName: function (show) {
        for (var k in Editor.changeble_elements[Editor.selected_form_id]['name-elements']) {
            var elem = $(Editor.changeble_elements[Editor.selected_form_id]['name-elements'][k]);
            if (show) {
                $('#lb-button-' + elem.attr('data-lb-id')).show();
                elem.show();
            } else {
                $('#lb-button-' + elem.attr('data-lb-id')).hide();
                elem.hide();
            }
        }
    },

    checkIfCanShowFirstName: function () {
        var show = false;
        if (Editor.first_name_available.indexOf(Editor.selected_form_optin_type) != -1 && Editor.changeble_elements[Editor.selected_form_id]['name-opt-in'] === true) {
            show = true;
        }
        return show;
    },
    /*****************************************************************************************************************  */


    /**
     * Если мы выбрали или изменили select `Select integration` в блоке Opt-in Form Integration
     */
    formTypeChange: function (not_animate) {
        var selected_radio = $('input[name="form-options"]:checked');
        var show_redirect_url = false;
        var val = $('#id-lp-integration-select').val();
        var select_path = $('#sales_path').val();

        if (not_animate) {
            $('.integration-choice:not(#' + val + '-choice)').hide();
        } else {
            $('.integration-choice:not(#' + val + '-choice)').slideUp();
        }
        if (val) {
            show_redirect_url = true;
            if (not_animate) {
                $('#' + val + '-choice').show();
                if (select_path == 'custom') {
                    $('#lp-modal-forms-tnakyou').show();
                }
            } else {
                $('#' + val + '-choice').slideDown();
            }
        }

        $('.note-for-t-y-p').hide();
        if (val == 'mailchimp' || val == 'icontact' || val == 'getresponse' || val == 'constantcontact' || val == 'gotowebinar') {
            var service_name = 'service';
            //show_redirect_url = true;
            if (val == 'mailchimp') {
                service_name = 'MailChimp';
            } else if (val == 'icontact') {
                service_name = 'iContact';
            } else if (val == 'getresponse') {
                service_name = 'GetResponse';
            } else if (val == 'constantcontact') {
                service_name = 'ConstantContact';
            } else if (val == 'gotowebinar') {
                service_name = 'GoToWebinar';
            }
            $('.lp-service-name-for-t-y-p').text(service_name);
            if (service_name != 'service') {
                $('.note-for-t-y-p').show();
            }
        }

        if (val != Editor.selected_form_optin_type) {
            $('#' + Editor.selected_form_optin_type + '-choice .btn-success.active').removeClass('btn-success active');
            Editor.selected_form_optin_type = val;
            Editor.selected_form_optin = null;
        }
        if (Editor.selected_form_optin_type == 'gotowebinar') {
            $('#gtw-on-off-btn').hide();
            $('#gtw-title').text('Choose your webinar');
            $('#gtw-block').insertBefore('#lp-modal-forms-tnakyou');
        } else {
            $('#gtw-block').insertBefore('#bribe-mail-old');
            if ($('#lp-gotowebinar-check').is(':checked')) {
                $('#gotowebinar-choice').slideDown();
            } else {
                $('#gotowebinar-choice').slideUp();
            }
            $('#gtw-on-off-btn').show();
            if ($('#gtw-title').text() != 'Integrate with GoToWebinar') {
                $('#gtw-title').text('Integrate with GoToWebinar');
            }
        }
        Editor.showHideFirstNameOption();
        Editor.showHideSalesPathOption(show_redirect_url);
    },

    /**
     * SEO Settings
     */
    openSEOSettings: function () {
        Editor.beforeOpenEditor(null);
        $('#lp-modal-header').html('SEO Settings <i class="editico ic-seosettings pull-right"></i>');
        $('#lp-form-submit').unbind('click');
        $('#lp-form-submit').click(function () {
            $('#basic-settings-form').submit();
        });
        $('#lp-seo-settings').show();
        Editor.openEditor(null);
        $('#id-page-title').val(Editor.page_title);
        $('#id-page-description').val(Editor.page_description);
        $('#id-page-keywords').val(Editor.page_keywords);
        Editor.submitFormListener = function () {
            Editor.saveSEOSettings();
        };
        Editor.closeEditorListener = function (cancel_button) {
            if (cancel_button !== true) {
                Editor.submitFormListener();
                return;
            }
            $('#id-page-title').val(Editor.page_title);
            $('#id-page-description').val(Editor.page_description);
            $('#id-page-keywords').val(Editor.page_keywords);
        };
    },

    /**
     * Tracking Settings
     */
    openTrackingCodeSettings: function () {
        Editor.beforeOpenEditor(null);
        $('#lp-modal-header').html('Tracking Code <i class="editico ic-trackingcode pull-right"></i>');
        $('#lp-form-submit').unbind('click');
        $('#lp-form-submit').click(function () {
            $('#tracking-code-form').submit();
        });
        $('#lp-tracking-code').show();
        Editor.openEditor(null);
        $('#id-lp-head-code').val(Editor.user_head_code);
        $('#id-lp-analytics').val(Editor.user_analytics_code);
        Editor.submitFormListener = function () {
            Editor.saveTrackingCodeSettings();
        };
        Editor.closeEditorListener = function (cancel_button) {
            if (cancel_button !== true) {
                Editor.submitFormListener();
                return;
            }
            $('#id-lp-head-code').val(Editor.user_head_code);
            $('#id-lp-analytics').val(Editor.user_analytics_code);
        };
    },

    /**
     * Сохранение SEO настроек
     */
    saveSEOSettings: function () {
        Editor.page_title = $('#id-page-title').val();
        Editor.page_keywords = $('#id-page-keywords').val();
        Editor.page_description = $('#id-page-description').val();
        $('#basic-page-settings').addClass('success');
    },

    /**
     * Сохранение Tracking Code
     */
    saveTrackingCodeSettings: function () {
        Editor.user_analytics_code = $('#id-lp-analytics').val();
        Editor.user_head_code = $('#id-lp-head-code').val();
        $('#tracking-code-settings').addClass('success');
    },


    /**
     * Opt-in Form Integration
     */
    selectOptInFormSubmit: function () {
        if (Editor.selected_form_optin_type == 'gotowebinar') {
            Editor.selected_form_optin = ($('#lb-gotowebinar-forms-select').val()) ? $('#lb-gotowebinar-forms-select').val() : null;
        } else {
            Editor.selected_form_optin = $('#lb-' + Editor.selected_form_optin_type + '-forms-select').val();
        }
        Editor.selected_webinar_key = ($('#lb-gotowebinar-forms-select').val()) ? $('#lb-gotowebinar-forms-select').val() : null;
        Editor.selected_bribe_file = ($('#digital-asset-delivery').val()) ? $('#digital-asset-delivery').val() : null;
        if (!$('#lp-modal-forms-form').valid()) {
            return false;
        }

        if ($('#lp-gotowebinar-check').is(':checked') && !Editor.selected_webinar_key) {
            $('#gotowebinar-choice p.p-transition').addClass('text-error');
            return false;
        } else if ($('#lp-gotowebinar-check').is(':checked') && Editor.selected_webinar_key && Editor.selected_form_optin_type != 'gotowebinar') {
            Editor.changeble_elements[Editor.selected_form_id]['webinar'] = true;
            Editor.changeble_elements[Editor.selected_form_id]['webinar_key'] = Editor.selected_webinar_key;
        } else {
            Editor.changeble_elements[Editor.selected_form_id]['webinar'] = false;
            Editor.changeble_elements[Editor.selected_form_id]['webinar_key'] = null;
        }
        if ($('#digital-asset-delivery-container .active').is('.btn-success') && !Editor.selected_bribe_file) {
            return false;
        } else if ($('#digital-asset-delivery-container .active').is('.btn-success') && Editor.selected_bribe_file) {
            Editor.changeble_elements[Editor.selected_form_id]['bribe_mail'] = true;
            Editor.changeble_elements[Editor.selected_form_id]['bribe_file_id'] = Editor.selected_bribe_file;
        } else {
            Editor.changeble_elements[Editor.selected_form_id]['bribe_mail'] = false;
            Editor.changeble_elements[Editor.selected_form_id]['bribe_file_id'] = null;
        }
        if (!Editor.selected_form_optin && (Editor.selected_form_optin_type == 'gotowebinar' || Editor.selected_form_optin_type == 'mailchimp' || Editor.selected_form_optin_type == 'icontact' || Editor.selected_form_optin_type == 'getresponse' || (Editor.selected_form_optin_type == 'aweber' && !Editor.aweber_copy_paste) || Editor.selected_form_optin_type == 'infusionsoft')) {
            return false;
        }

        if (Editor.selected_form_optin_type == 'mailchimp' || Editor.selected_form_optin_type == 'icontact' || Editor.selected_form_optin_type == 'getresponse' || Editor.selected_form_optin_type == 'constantcontact' || Editor.selected_form_optin_type == 'gotowebinar') {
            var redirect_url = $('#id-form-typ-url').val();
            if (Editor.sales_path_custom_redirect) {
                Editor.sales_path = redirect_url;
            } else {
                Editor.sales_path = $('#sales_path').val();
            }
            Editor.changeble_elements[Editor.selected_form_id]['optin_type'] = Editor.selected_form_optin_type;
            Editor.changeble_elements[Editor.selected_form_id]['value'] = Editor.selected_form_optin;
            Editor.changeble_elements[Editor.selected_form_id]['redirect_url'] = redirect_url;
            Editor.changeble_elements[Editor.selected_form_id]['sales_path'] = $('#sales_path').val();
        } else if ((Editor.selected_form_optin_type == 'aweber' && Editor.aweber_copy_paste) || Editor.selected_form_optin_type == 'officeautopilot' || Editor.selected_form_optin_type == 'shoppingcart' || Editor.selected_form_optin_type == 'sendreach') {
            var val = null;
            var error_message = null;
            if (Editor.selected_form_optin_type == 'officeautopilot') {
                val = $('#id-lp-officeautopilot-copy-paste').val();
                error_message = $('#officeautopilot-error-msg');
            } else if (Editor.selected_form_optin_type == 'sendreach') {
                val = $('#id-lp-sendreach-copy-paste').val();
                error_message = $('#sendreach-error-msg');
            } else if (Editor.selected_form_optin_type == 'shoppingcart') {
                val = $('#id-lp-shoppingcart-copy-paste').val();
                error_message = $('#shoppingcart-error-msg');
            } else if (Editor.selected_form_optin_type == 'aweber') {
                val = $('#id-lp-aweber-copy-paste').val();
                error_message = $('#aweber-error-msg');
            }
            if (!val) {
                error_message.addClass('error-msg');
                return false;
            }
            try {
                var $val = $(val);
                if (!$(val).is('form') && !$val.find('form').get(0)) {
                    error_message.addClass('error-msg');
                    return false;
                }
                if (val.indexOf("</form>") < 1) {
                    error_message.addClass('error-msg');
                    return false;
                }
            } catch (err) {
                error_message.addClass('error-msg');
                return false;
            }
            error_message.removeClass('error-msg');
            if (!val) {
                Editor.changeble_elements[Editor.selected_form_id]['optin_type'] = null;
                Editor.changeble_elements[Editor.selected_form_id]['value'] = null;
            } else {
                Editor.changeble_elements[Editor.selected_form_id]['optin_type'] = Editor.selected_form_optin_type;
                Editor.changeble_elements[Editor.selected_form_id]['value'] = escape(val);
            }
            Editor.changeble_elements[Editor.selected_form_id]['redirect_url'] = '';
        } else if (Editor.selected_form_optin_type == 'aweber' || Editor.selected_form_optin_type == 'infusionsoft') {
            Editor.changeble_elements[Editor.selected_form_id]['optin_type'] = Editor.selected_form_optin_type;
            Editor.changeble_elements[Editor.selected_form_id]['value'] = Editor.selected_form_optin;
            Editor.changeble_elements[Editor.selected_form_id]['redirect_url'] = '';
        }
        Editor.saveFirstName();
        Editor.showHideFirstName(Editor.changeble_elements[Editor.selected_form_id]['use-name']);
        $('#lb-button-' + Editor.selected_form_id).addClass('success');
        Editor.closeEditor();
        Editor.removableCheckOnsubmit(Editor.selected_form_id);
        Editor.selected_form_id = null;
        Editor.selected_form_optin = null;
        Editor.selected_form_optin_type = null;
        Editor.markChange();
    },

    /**
     * Сохраняем шаблон
     * ajax запрос
     */
    saveIt: function (callback, beforeAPICb) {
        if (Editor.saving) {
            return;
        }
        var request = 'save-template';
        if (Editor.edit) {
            request = 'edit-page';
            var url = window.location.href;
            var pattern = /\d+/;
            var id_user_variation = pattern.exec(url);

            $('#save-btn-space button').button('loading');
        } else {
            $('#lp-save-submit').button('loading');
        }
        Editor.iframe.contents().find('.lp-text-editable').attr('contentEditable', null);
        var element_data = $.extend(true, {}, Editor.changeble_elements);
        for (var k in element_data) {
            delete element_data[k]['name-elements'];
            delete element_data[k]['name-elements'];
            delete element_data[k]['elements'];
            delete element_data[k]['name'];
            delete element_data[k]['function_to_call'];
            delete element_data[k]['icon'];
            delete element_data[k]['default_text'];
            delete element_data[k]['hidden'];
            delete element_data[k]['connected-image'];
            delete element_data[k]['comment'];
            delete element_data[k]['comment'];
        }
        Editor.saving = true;
        if (Editor.hasValidationError)
            Editor.hideValidationError();
        if (beforeAPICb) beforeAPICb();

        if (request == 'edit-page')
            _method = 'update';
        if (request == 'save-template')
            _method = 'save';

        API.apiCall({
            data: {
                'request': request,
                'user_variation_id': id_user_variation,
                'template_id': Editor.template_id,
                'template_name': $('#id_page_name').val(),
                'page_url': $('#id_page_url').val(),
                'data': JSON.stringify(element_data),
                'color_data': JSON.stringify(Editor.changable_colors),
                'font_data': JSON.stringify(Editor.changable_fonts),
                'js_data': JSON.stringify(Editor.js_variables),
                'page_title': Editor.page_title,
                'page_keywords': Editor.page_keywords,
                'page_description': Editor.page_description,
                'user_analytics_code': Editor.user_analytics_code,
                'user_head_code': Editor.user_head_code,
                'private_template': Editor.private_template,
                'is_test': Editor.is_test,
                'is_control': Editor.is_control,
                'is_variation': Editor.is_variation,
                'target_url': Editor.target_url,
                'target_page': Editor.target_page,
                'exit_popup': Editor.exit_popup,
                'exit_popup_message': Editor.exit_popup_message,
                'exit_popup_redirect': Editor.exit_popup_redirect,
                'exit_popup_redirect_url': Editor.exit_popup_redirect_url,
                "bribemail": $("#digital-asset-delivery").val(),
                "form": Editor.optin_form_id,
                'sales_path': Editor.sales_path,
                'service_integration': $('#id-lp-integration-select').val(),
                'service_list': $('#lb-mailchimp-forms-select').val()
            },
            method: _method,
            type: 'POST',
            async: true,
            success: function (data) {
                var id = data.body * 1;
                var onSuccess = function () {
                    var pub_url = Editor.public_page_url;
                    if (!Editor.edit) {
                        pub_url = $('#account_subdomain_url').text() + $('#id_page_url').val();
                    }
                    Editor.change_made = false;
                    $("#save-button").removeClass("disabled");
                    $("#save-button").removeClass("has-changes");
                    Editor.saving = false;
                    Editor.template_id = id;
                    Editor.edit = true;
                    setTimeout(function () {
                        $("#lp-publish-modal iframe")[0].contentDocument.location.reload();
                    }, 500);
                    if (callback) callback(true);
                };
                var checkTimeout = 1000;
                var checkGeneration = function () {
                    API.apiCall({
                        data: {
                            'request': 'my-page-regenerate-status',
                            'user_variation_id': id
                        },
                        method: 'regenerate',
                        type: 'GET',
                        async: true,
                        success: function (data) {
                            if (data.status == '200') {
                                onSuccess();
                            } else {
                                setTimeout(checkGeneration, checkTimeout);
                                checkTimeout += 1000;
                            }
                        }
                    });
                };
                checkGeneration();
            },
            error: function () {
                Editor.saving = false;
                if (callback) callback(false);
            }
        });

    },

    /**
     *
     */
    setListeners: function () {
        var pre_submit = function () {
            if (!$(this).valid()) {
                return false;
            }
            Editor.submitFormListener();
            Editor.closeEditorListener = function () {
            };
            Editor.closeEditor();
            Editor.markChange();
            return false;
        };
        $('#lp-edit-text form').submit(pre_submit);
        $('#lp-edit-rich-text form').submit(pre_submit);
        $('#lp-edit-richtext-area form').submit(pre_submit);
        $('#lp-change-link form').submit(pre_submit);
        $('#lp-edit-btn-text form').submit(pre_submit);
        $('#lp-edit-placeholder form').submit(pre_submit);
        $('#lp-edit-video form').submit(pre_submit);
        $('#lp-edit-optin-box form').submit(pre_submit);
        $('#lp-change-style form').submit(pre_submit);
        $('#lp-edit-area form').submit(pre_submit);
        $('#tracking-code-form').submit(pre_submit);
        $('#basic-settings-form').submit(pre_submit);
        $('#exit-popup-settings-form').submit(pre_submit);
        $('#lp-modal form').validate();
        $('#lp-modal-forms-form').validate();
        $('#lp-modal-forms-form').submit(function () {
            Editor.selectOptInFormSubmit();
            return false;
        });
        $('#lp-change-js-variables form').submit(function () {
            Editor.submitFormListener();
            Editor.closeEditor();
            return false;
        });
        $('#lp-edit-analytics form').submit(function () {
            if (!$(this).valid()) {
                return false;
            }
            Editor.submitFormListener();
            Editor.markChange();
            return false;
        });
        $('#id-lp-integration-select').click(function () {
            Editor.formTypeChange(false);
        });
        $('#id-lp-integration-select').change(function () {
            Editor.formTypeChange(false);
        });
        $('#lb-gotowebinar-forms-select').change(function () {
            $('#selected-webinar-dont-exist').fadeOut();
        });
        $('#sales_path').click(function () {
            Editor.salesRedirect($(this).val());
        });
        $('#sales_path').change(function () {
            Editor.salesRedirect($(this).val());
        });
    },

    salesRedirect: function (value) {
        if (value == 'custom') {
            Editor.sales_path = 'custom';
            Editor.sales_path_custom_redirect = true;
            $('#lp-modal-forms-tnakyou').slideDown();
        }
        else if (!value) // if empty
        {
            Editor.sales_path = null;
            Editor.sales_path_custom_redirect = false;
            $('#id-form-typ-url').val('');
            $('#lp-modal-forms-tnakyou').slideUp();
        }
        else // 1,2,3,...
        {
            Editor.sales_path = value;
            Editor.sales_path_custom_redirect = false;
            $('#id-form-typ-url').val('');
            $('#lp-modal-forms-tnakyou').slideUp();
        }
    },

    /**
     * берем из переменной GOOGLE_FONTS шрифты и подключаем их к странице и шаблону
     */
    setFonts: function () {
        Editor.font_options_str = '<option value="">Default font</option>';
        for (var k in GOOGLE_FONTS) {
            $('head').append($('<link href="' + GOOGLE_FONTS[k]['url'] + '" rel="stylesheet" type="text/css" />'));
            Editor.iframe.contents().find('head').append($('<link href="' + GOOGLE_FONTS[k]['url'] + '" rel="stylesheet" type="text/css" />'));
            Editor.font_options_str = Editor.font_options_str + '<option value="' + GOOGLE_FONTS[k]['name'] + '">' + GOOGLE_FONTS[k]['name'] + '</option>';
        }
    },

    /**
     * Поиск дефолтных шрифтов в дефолтном шаблоне и замена их на новые (те, что изменил юзер)
     * Поиск дефолтных цветов в дефолтном шаблоне и замена их на новые (те, что изменил юзер)
     */
    setChangebleStyle: function () {
        var fonts = false;
        Editor.iframe.contents().find('head meta[name="lp-customizable-font"]').each(function () {
            fonts = true;
            var $this = $(this);
            var font = $.trim($(this).attr('content').split(';')[0]); // шрифт
            var name = $.trim($(this).attr('content').split(';')[1]); // имя шрифта
            var value = font;
            if (Editor.font_data[font] && Editor.font_data[font]['value']) {
                value = Editor.font_data[font]['value'];
            }
            Editor.changable_fonts[font] = {
                'font': font,
                'name': name,
                'value': value
            };
        });
        if (fonts) {
            for (var k in Editor.changable_fonts) {
                var font_form_html = '';
                font_form_html += '<div class="control-group">';
                font_form_html += '   <label class="control-label">' + Editor.changable_fonts[k]['name'] + '</label>';
                font_form_html += '   <div class="input-space controls">';
                font_form_html += '       <select data-lb-base-font="' + k + '" class="font-picker input-large">' + Editor.font_options_str + '</select>';
                font_form_html += '   </div>';
                font_form_html += '</div>';
                var ffh = $(font_form_html);
                ffh.find('option[value=""]').val(k);

                // вставляем шрифты в блок
                $('#fonts-inp-space').append(ffh);
                $('.font-picker[data-lb-base-font="' + k + '"]').val(Editor.changable_fonts[k]['value']);
                ffh.find('select').change(Editor.doStyleQuickChange);
            }
        } else {
            $('.lp-fonts-space').hide();
        }

        // поиск цветов
        var colors = false;
        $('#lp-template-iframe').contents().find('head meta[name="lp-customizable-color"]').each(function () {
            colors = true;
            var $this = $(this);
            var color = $.trim($(this).attr('content').split(';')[0]); // #fbc406
            var name = $.trim($(this).attr('content').split(';')[1]);
            var value = color; // #fbc406
            if (Editor.color_data[color] && Editor.color_data[color]['value']) {
                value = Editor.color_data[color]['value']; // #2860af
            }
            Editor.changable_colors[color] = {
                'color': color, // #fbc406
                'name': name,
                'value': value // #2860af
            };
        });
        if (colors) {
            for (var c in Editor.changable_colors) {
                var color_form_html = '';
                color_form_html += '<div class="control-group">';
                color_form_html += ' <label class="control-label">' + Editor.changable_colors[c]['name'] + '</label>';
                color_form_html += ' <div class="input-space controls">';
                color_form_html += '     <div class="input-append color color-picker" data-color="' + Editor.changable_colors[c]['value'] + '" data-color-format="hex">';
                color_form_html += '           <input type="text" data-lb-base-color="' + c + '" class="span2 color-picker-input" value="' + Editor.changable_colors[c]['value'] + '" readonly>';
                color_form_html += '           <span class="add-on"><i style="background-color: ' + Editor.changable_colors[c]['value'] + '"></i></span>';
                color_form_html += '     </div>';
                color_form_html += ' </div>';
                color_form_html += '</div>';

                // выводим в блоке на сайте цвета
                $('#colors-inp-space').append($(color_form_html));
            }

            // онлайн изменение цвета
            $('.color-picker').colorpicker().on('changeColor', function (ev) {
                $(this).children('.color-picker-input').val(ev.color.toHex());
                Editor.doStyleQuickChange();
            });

        } else {
            $('.lp-colors-space').hide();
        }
        $('#style-settings').show();
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            $this = $(this);
            $this.attr('data-lb-original', $this.text());
            $this.attr('data-lb-changing', '');
        });
        Editor.doStyleChange();
    },

    /**
     * форма Style Settings
     */
    openStyleSettings: function () {
        Editor.beforeOpenEditor(null);
        $('#lp-modal-header').html('Style Settings <i class="editico ic-stylesettings pull-right"></i>');
        $('#lp-form-submit').unbind('click');

        // отправка формы для сохранения стилей
        $('#lp-form-submit').click(function () {
            $('#lp-change-style form').submit();
        });

        $('#lp-change-style').show();
        Editor.openEditor(null);

        // сохраняем в массив все наши изменения по цветам
        Editor.submitFormListener = function () {
            $("input.color-picker-input").each(function () {
                var $this = $(this);
                var value = $this.val();
                var key = $this.attr('data-lb-base-color');
                if (Editor.changable_colors[key]['value'] != value) {
                    if (value === '') {
                        value = key;
                    }
                    Editor.changable_colors[key]['value'] = value;
                }
            });

            // сохраняем в массив изменения по шрифту
            $("select.font-picker").each(function () {
                var $this = $(this);
                var value = $this.val();
                var key = $this.attr('data-lb-base-font');
                if (Editor.changable_fonts[key]['value'] != value) {
                    Editor.changable_fonts[key]['value'] = value;
                }
            });

            $('#style-settings').addClass('success');

            // применяем стили
            Editor.doStyleChange();
        };

        Editor.closeEditorListener = function () {
            $("input.color-picker-input").each(function () {
                var $this = $(this);
                var key = $this.attr('data-lb-base-color');
                $this.val(Editor.changable_colors[key]['value'].toLowerCase());
                $this.minicolors('value', Editor.changable_colors[key]['value'].toLowerCase());
                $this.val(Editor.changable_colors[key]['value'].toLowerCase());
            });
            $("select.font-picker").each(function () {
                var $this = $(this);
                var key = $this.attr('data-lb-base-font');
                $this.val(Editor.changable_fonts[key]['value']);
            });
            Editor.doStyleChange();
        };
    },

    /**
     * Дефолтное значение цветов
     */
    resetColors: function () {
        $(".color-picker-input").each(function () {
            var $this = $(this);
            var key = $this.attr('data-lb-base-color');
            if (Editor.changable_colors) {
                $this.val(Editor.changable_colors[key]['color'].toLowerCase());
                $this.minicolors('value', Editor.changable_colors[key]['color'].toLowerCase());
                $this.parent('.color-picker').find('i').attr('style', 'background-color:' + Editor.changable_colors[key]['color'].toLowerCase());
            }

        });
        Editor.doStyleQuickChange();
    },

    /**
     * data-lb-changing = data-lb-original
     */
    doStyleChange: function () {
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            var $this = $(this);
            $this.attr('data-lb-changing', $this.attr('data-lb-original'));
        });
        Editor.doColorChange();
        Editor.doFontChange();
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            var $this = $(this);
            $this.text($this.attr('data-lb-changing'));
            $this.attr('data-lb-changing', '');
        });
    },

    /**
     * создаем атрибут data-lb-changing на основе оригинального data-lb-original с такими же данными
     */
    doStyleQuickChange: function () {
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            var $this = $(this);
            $this.attr('data-lb-changing', $this.attr('data-lb-original'));
        });
        Editor.doColorQuickChange(); // меняем цвет
        Editor.doFontQuickChange();
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            var $this = $(this);
            $this.text($this.attr('data-lb-changing'));
            $this.attr('data-lb-changing', '');
        });
    },

    /**
     * получаем старый цвет
     * получаем новый цвет
     * отправляем запрос на изменение цветов
     */
    doColorQuickChange: function () {
        $(".color-picker-input").each(function () {
            var $this = $(this);
            var key = $this.attr('data-lb-base-color');
            var old_color = Editor.changable_colors[key]['color'];
            var new_color = $this.val();
            Editor.executeColorChangeInCss(old_color, new_color);
        });
    },

    doFontQuickChange: function () {
        $("select.font-picker").each(function () {
            var $this = $(this);
            var new_font = "'" + $this.val().replace(new RegExp("'", 'g'), '') + "'";
            var key = $this.attr('data-lb-base-font');
            var old_font = Editor.changable_fonts[key]['font'].replace(new RegExp("'", 'g'), '');
            Editor.executeFontChangeInCss(old_font, new_font);
        });
    },

    doColorChange: function () {
        for (var k in Editor.changable_colors) {
            if (Editor.changable_colors[k]['value']) {
                var old_color = Editor.changable_colors[k]['color'];
                var new_color = Editor.changable_colors[k]['value'];
                Editor.executeColorChangeInCss(old_color, new_color);
            }
        }
    },

    doFontChange: function () {
        for (var k in Editor.changable_fonts) {
            if (Editor.changable_fonts[k]['value']) {
                var old_font = Editor.changable_fonts[k]['font'].replace(new RegExp("'", 'g'), '');
                var new_font = "'" + Editor.changable_fonts[k]['value'].replace(new RegExp("'", 'g'), '') + "'";
                Editor.executeFontChangeInCss(old_font, new_font);
            }
        }
    },

    /**
     * Замена старого цвета на новый
     */
    executeColorChangeInCss: function (old_color, new_color) {
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            var $this = $(this);
            if (old_color != new_color) {
                var attr = $this.attr('data-lb-changing');
                if (typeof attr !== 'undefined' && attr !== false) {
                    $this.attr('data-lb-changing', $this.attr('data-lb-changing').replace(new RegExp(old_color.toUpperCase(), 'g'), new_color));
                    $this.attr('data-lb-changing', $this.attr('data-lb-changing').replace(new RegExp(old_color.toLowerCase(), 'g'), new_color));
                }
            }
        });
    },

    /**
     * меняем шрифт в iframe
     */
    executeFontChangeInCss: function (old_font, new_font) {
        $('#lp-template-iframe').contents().find('head style[type="text/css"]').each(function () {
            var $this = $(this);
            if (old_font != new_font) {
                var attr = $this.attr('data-lb-changing');
                if (typeof attr !== 'undefined' && attr !== false) {
                    $this.attr('data-lb-changing', $this.attr('data-lb-changing').replace(new RegExp("'" + old_font + "'", 'g'), new_font));
                }
            }
        });
    },


    /**
     * Парсинг елементов iframe
     * Инициализация шаблона - обнуление действий браузера ссылки, формы
     * Поиск его елементов и вывод их списком
     * Инициализация сайдбара
     */
    setEditableText: function () {
        $('#lp-template-iframe').contents().find('form').submit(Editor.return_false);
        $('#lp-template-iframe').contents().find('a').click(function (e) {
            e.preventDefault();
        });
        $('#lp-template-iframe').contents().find('label').click(Editor.return_false);
        if ($("#lp-template-iframe").contents().find("[data-lb=\"optin-form-trigger\"]").on("click", function () {
                $("#optin-form").trigger("click");
            }).length) {
            Editor.is_optin_form = true;
            var iframe = $("#lp-form-editor").attr("src", "template/my-forms/create/" +
                Editor.real_template_id + "/" +
                Editor.page_id + "/");

            // показываем пункт меню
            $("#optin-form").show().on("click", function () {
                window.widgetCloseCallback();
                iframe.addClass('visible');
                var frame = iframe.show()[0];
                if (frame.contentWindow.callOnResizeCb)
                    frame.contentWindow.callOnResizeCb();
            });

        }

        // находим редактируемые (с меткой `editable`) елементы и загоняем их в общий массив
        $('#lp-template-iframe').contents().find('[data-lb*="editable"]').each(function () {
            var elem = this;
            var $this = $(this);
            var element_id = null;
            var no_clicking = false;
            var exist = false;
            var element_data = {};
            var function_to_call = function () {
            };

            if ($this.attr('data-lb-id')) {
                element_id = $this.attr('data-lb-id');
            }

            // Если в массиве нет таких елементов то добавляем их
            if (!Editor.changeble_elements[element_id]) {
                element_data = {
                    'lb-id': element_id,
                    'removable': false,
                    'removed': false,
                    'hidden': false,
                    'comment': ($this.attr('data-lb-comment')) ? $this.attr('data-lb-comment') : null,
                    'elements': [elem],
                    'type': '',
                    'data-lb': $this.attr('data-lb'),
                    'name': $this.attr('data-lb-name'),
                    'icon': ''
                };
            } else {
                element_data = Editor.changeble_elements[element_id];
                exist = true;
                element_data = Editor.changeble_elements[element_id];
                element_data['elements'].push(elem);
            }

            if ($this.is('a[data-lb~="editable-link"]') && (!exist || element_data['type'] == 'link')) {
                if (!exist) {
                    function_to_call = function () {
                        Editor.editLink(elem, element_id);
                    };
                    element_data['type'] = 'link';
                    element_data['href'] = '';
                    element_data['new_window'] = false;
                    element_data['nofollow'] = false;
                    element_data['default_text'] = $this.text();
                }
                if ((Editor.edit || exist) && Editor.edit_data[element_id] && Editor.edit_data[element_id]['type'] == 'link' && (Editor.edit_data[element_id]['href'] || Editor.edit_data[element_id]['text'] || Editor.edit_data[element_id]['nofollow'] || Editor.edit_data[element_id]['new_window'])) {
                    if (!$this.is('a[data-lb~="link-only"]')) {
                        $this.text(Editor.edit_data[element_id]['text']);
                    }
                    if (Editor.edit_data[element_id]['new_window']) {
                        element_data['new_window'] = true;
                    }
                    if (Editor.edit_data[element_id]['nofollow']) {
                        element_data['nofollow'] = true;
                    }
                    $this.attr('href', Editor.edit_data[element_id]['href']);
                    element_data['href'] = $this.attr('href');
                    element_data['default_text'] = null;
                }
                element_data['connected-image'] = null;
                element_data['icon'] = 'link';
                if ($this.is('[data-lb~="link-only"]') && $this.children().length == 1 && $($this.children()[0]).is('img[data-lb~="editable-image"]')) {
                    element_data['connected-image'] = {
                        'elem': $($this.children()[0]),
                        'id': $($this.children()[0]).attr('data-lb-id')
                    };
                    element_data['icon'] = 'image';
                }
                element_data['text'] = $this.text();
            }


            /**
             * editable-text
             * editable-rich-text
             * type = "text"
             */
            if ($this.is('[data-lb~="editable-text"]') || $this.is('[data-lb~="editable-rich-text"]') && (!exist || element_data['type'] == 'text')) {

                if (!exist) {
                    // callback функция на редактирование елемента
                    function_to_call = function () {
                        Editor.editText(elem, element_id);
                    };
                    element_data['type'] = 'text';

                    // берем текущее значение (текст) елемента и заносим в default_text
                    if ($this.is('[data-lb~="editable-rich-text"]')) {
                        element_data['default_text'] = $this.html();
                    } else {
                        element_data['default_text'] = $this.text();
                    }
                }

                // загружаем данные в поля из сохраненного шаблона (то что сохранил пользователь ранее в базе)
                if ((Editor.edit || exist) && Editor.edit_data[element_id] && Editor.edit_data[element_id]['type'] == 'text' && Editor.edit_data[element_id]['text']) {
                    if ($this.is('[data-lb~="editable-rich-text"]')) {
                        $this.html(Editor.edit_data[element_id]['text']);
                    } else {
                        $this.text(Editor.edit_data[element_id]['text']);
                    }
                    element_data['default_text'] = null;
                }

                // берем текущее значение (текст) елемента и заносим в text
                if (!exist) {
                    if ($this.is('[data-lb~="editable-rich-text"]')) {
                        element_data['text'] = $this.html();
                    } else {
                        element_data['text'] = $this.text();
                    }
                }
                element_data['icon'] = 'text';

            } else if ($this.is('img[data-lb~="editable-image"]') && (!exist || element_data['type'] == 'image')) {
                if (!exist) {
                    function_to_call = function () {
                        Editor.editImage(element_id);
                    };
                    element_data['type'] = 'image';
                    element_data['default_url'] = $this.attr('src');
                }
                var img_id = '';
                if ((Editor.edit || exist) && Editor.edit_data[element_id] && Editor.edit_data[element_id]['type'] == 'image' && Editor.edit_data[element_id]['url']) {
                    $this.attr('src', Editor.edit_data[element_id]['url']);
                    img_id = Editor.edit_data[element_id]['id'];
                }
                element_data['url'] = $this.attr('src');
                element_data['id'] = img_id;
                var $parent = $this.parent();
                if ($parent.is('a[data-lb~="editable-link"]') && $parent.is('a[data-lb~="link-only"]')) {
                    element_data['hidden'] = true;
                    no_clicking = true;
                }
                element_data['icon'] = 'image';

            } else if ($this.is('form[data-lb~="editable-opt-in-form"]') && (!exist || element_data['type'] == 'opt-in-form')) {
                function_to_call = function () {
                    Editor.editOptinForm(element_id);
                };
                no_clicking = true;
                if (!exist) {
                    element_data['type'] = 'opt-in-form';
                    element_data['redirect_url'] = '';
                    element_data['sales_path'] = '';
                    element_data['webinar'] = false;
                    element_data['use-name'] = false;
                    element_data['name-opt-in'] = false;
                    element_data['name-elements'] = [];
                    element_data['webinar_key'] = null;
                    element_data['bribe_mail'] = false;
                    element_data['bribe_file_id'] = null;

                    if ($this.find('input[data-lb~="opt-in-name"]').get(0)) {
                        element_data['name-opt-in'] = true;
                    }

                    if (Editor.edit && Editor.edit_data[element_id] && Editor.edit_data[element_id]['type'] == 'opt-in-form') {
                        if (Editor.edit_data[element_id]['optin_type'] && Editor.edit_data[element_id]['value']) {
                            element_data['optin_type'] = Editor.edit_data[element_id]['optin_type'];
                            element_data['value'] = Editor.edit_data[element_id]['value'];

                            if (element_data['optin_type'] == 'mailchimp' || element_data['optin_type'] == 'icontact' || element_data['optin_type'] == 'getresponse' || element_data['optin_type'] == 'constantcontact' || element_data['optin_type'] == 'gotowebinar') {
                                element_data['redirect_url'] = Editor.edit_data[element_id]['redirect_url'];
                                element_data['sales_path'] = Editor.edit_data[element_id]['sales_path'];
                            }
                            if (element_data['name-opt-in'] && Editor.edit_data[element_id]['use-name']) {
                                element_data['use-name'] = true;
                            }
                            if (!AVAILABLE_SERVICES[element_data['optin_type']]) {
                                element_data['optin_type'] = '';
                                element_data['value'] = '';
                            }
                            if (Editor.edit_data[element_id]['webinar'] && Editor.edit_data[element_id]['webinar_key'] && AVAILABLE_SERVICES['gotowebinar']) {
                                element_data['webinar'] = Editor.edit_data[element_id]['webinar'];
                                element_data['webinar_key'] = Editor.edit_data[element_id]['webinar_key'];
                            }
                        } else {
                            element_data['optin_type'] = '';
                            element_data['value'] = '';
                        }
                        if (Editor.edit_data[element_id]['bribe_mail'] && Editor.edit_data[element_id]['bribe_file_id']) {
                            element_data['bribe_mail'] = Editor.edit_data[element_id]['bribe_mail'];
                            element_data['bribe_file_id'] = Editor.edit_data[element_id]['bribe_file_id'];
                        }
                    } else {
                        element_data['optin_type'] = '';
                        element_data['value'] = '';
                    }
                }
                element_data['icon'] = 'optinform';

            } else if ($this.is('input[type="text"][data-lb~="editable-text-input"]') && (!exist || element_data['type'] == 'text_input')) {
                if (!exist) {
                    function_to_call = function () {
                        $this.blur();
                        Editor.editPlaceHolder(element_id);
                    };
                    element_data['type'] = 'text_input';
                    element_data['default_text'] = $this.attr('title');
                }
                if ((Editor.edit || exist) && Editor.edit_data[element_id] && Editor.edit_data[element_id]['type'] === 'text_input' && (Editor.edit_data[element_id]['title'] || Editor.edit_data[element_id]['title'] === '')) {
                    $this.attr('title', Editor.edit_data[element_id]['title']);
                    $this.val(Editor.edit_data[element_id]['title']);
                    element_data['default_text'] = null;
                }
                element_data['title'] = ($this.attr('title')) ? $this.attr('title') : '';
                $this.val(element_data['title']);
                element_data['icon'] = 'text';

            } else if ($this.is('input[type="submit"][data-lb~="editable-submit"]') && (!exist || element_data['type'] == 'submit')) {
                if (!exist) {
                    function_to_call = function () {
                        Editor.editSubmitButton(element_id);
                    };
                    element_data['type'] = 'submit';
                    element_data['default_text'] = $this.val();
                }
                if ((Editor.edit || exist) && Editor.edit_data[element_id] && Editor.edit_data[element_id]['type'] == 'submit' && Editor.edit_data[element_id]['text']) {
                    $this.val(Editor.edit_data[element_id]['text']);
                    element_data['default_text'] = null;
                }
                if (!exist) {
                    element_data['text'] = $this.val();
                }
                element_data['icon'] = 'text';
            }


            /**
             * поиск редактируемого елемента и помечаем его
             *
             * editable-removable
             * editable-optional
             * или removable
             */
            if (($this.is('[data-lb~="editable-removable"]') || $this.is('[data-lb~="editable-optional"]')) || element_data['removable']) {
                // помечаем елемент, что он может быть редактируемым
                element_data['removable'] = true;
                if (!exist && !element_data['type']) {
                    function_to_call = function () {
                        Editor.editRemovable(elem, element_id);
                    };
                }
                if (!element_data['type']) {
                    element_data['type'] = 'removable';
                }
                // если елемент имеет метку `removed` то помечаем его как скрытый
                if (Editor.edit && Editor.edit_data[element_id] && Editor.edit_data[element_id]['removed'] === true) {
                    element_data['removed'] = true;
                }
                // если елемент скрыт - скрываем его
                if (element_data['removed'] === true) {
                    $this.hide();
                }
                // ставим иконку как скрытую
                if (!element_data['icon']) {
                    element_data['icon'] = 'removable';
                }
            }

            // добавляем елементу callback функцию
            if (!exist) {
                // callback параметр с функцией
                element_data['function_to_call'] = function () {
                    // если мы первый раз выбрали елемент
                    // или если мы второй раз выбрали другой елемент
                    if (Editor.selected_element_id && (Editor.selected_element_id != element_id || (Editor.nowEditingElement === false || Editor.nowEditingElement != Editor.selected_element_id))) {
                        Editor.closeEditorListener();
                    }
                    // пометили выбранный елемент
                    Editor.selected_element_id = element_id;
                    function_to_call();
                };
            }

            // добавляем в массив к елементу callback параметр с функцией
            if (element_id) {
                Editor.changeble_elements[element_id] = element_data;
            }

            if (element_data['type'] != 'opt-in-form' && element_data['type'] != 'fadin-box') {
                $this.css('cursor', 'pointer');
            }


            /**
             * Клик по елементу
             */
            if (!no_clicking) {
                $this.click(function (event) {
                    // если редактор уже активирован
                    if (Editor.openingEditWindow) {
                        return;
                    }
                    // иначе разрешить активировать редактор и очистить function_to_call
                    Editor.openingEditWindow = true;
                    element_data['function_to_call']();
                    setTimeout(function () {
                        Editor.openingEditWindow = false;
                    }, 100);
                });
            }
        });

        // проходимся по нашему массиву елементов
        for (var k in Editor.changeble_elements) {
            // строим html список наших елементов и выводим его на сайте
            var button_elem = $('<a>', {
                'id': 'lb-button-' + Editor.changeble_elements[k]['lb-id'],
                'class': 'btn-block',
                'href': 'javascript:;'
            }).html('<i class="editico ic-' + Editor.changeble_elements[k]['icon'] + '"></i>' + Editor.changeble_elements[k]['name']);

            // вешаем обработчик клика на елементы - берем с параметра function_to_call
            button_elem.click(Editor.changeble_elements[k]['function_to_call']);

            // вешаем обработчик мыши (навели на елемент)
            // и строим для него border
            var mouseOver = function (key) {
                return function () {
                    var this_elems = Editor.changeble_elements[key]['elements'];
                    if (Editor.changeble_elements[key]['removable'] === true && Editor.changeble_elements[key]['removed'] === true) {
                        return;
                    }
                    var addBorder = function (elem) {
                        elem = $(elem);
                        var offset = elem.offset();
                        var width = elem.outerWidth();
                        var height = elem.outerHeight();
                        var border_top = $('<div></div>', {
                            'class': 'lb-border-element',
                            'data-lb-top': offset.top
                        });
                        var border_bottom = $('<div></div>', {
                            'class': 'lb-border-element',
                            'data-lb-top': offset.top + height - 1
                        });
                        var border_left = $('<div></div>', {
                            'class': 'lb-border-element',
                            'data-lb-top': offset.top
                        });
                        var border_right = $('<div></div>', {
                            'class': 'lb-border-element',
                            'data-lb-top': offset.top
                        });
                        $('body').append(border_top, border_bottom, border_left, border_right);
                        border_top.width(width);
                        border_bottom.width(width);
                        border_left.height(height);
                        border_right.height(height);
                        var elem_top = offset.top + Editor.iframe_top_position - Editor.iframe.contents().scrollTop();
                        var elem_left = offset.left + (($('#templete-settings').attr('data-hidden') === 'true') ? 0 : $('#templete-settings').width());
                        border_top.css('top', elem_top + 'px');
                        border_top.css('left', elem_left + 'px');
                        border_left.css('top', elem_top + 'px');
                        border_left.css('left', elem_left + 'px');
                        border_bottom.css('top', (elem_top + height - 1) + 'px');
                        border_bottom.css('left', elem_left + 'px');
                        border_right.css('top', elem_top + 'px');
                        border_right.css('left', (elem_left + width) + 'px');
                    };
                    $('.lb-border-element').remove();
                    $('#editable-elements a.hover').removeClass('hover');
                    $('#lb-button-' + key).addClass('hover');
                    for (var iii in this_elems) {
                        addBorder(this_elems[iii]);
                    }
                };
            };

            // Вешаем обработчик mouseOut для елемента
            if (Editor.changeble_elements[k])
                var mouseOut = function (key) {
                    return function () {
                        $('.lb-border-element').remove();
                        $('#editable-elements a.hover').removeClass('hover');
                    };
                };

            // если елемент не скрытый, то вешаем на него hover
            if (!Editor.changeble_elements[k]['hidden']) {
                button_elem.hover(mouseOver(k), mouseOut(k));
                if (Editor.changeble_elements[k]['type'] != 'opt-in-form' && Editor.changeble_elements[k]['type'] != 'fadin-box') {
                    for (var i in Editor.changeble_elements[k]['elements']) {
                        $(Editor.changeble_elements[k]['elements'][i]).hover(mouseOver(k), mouseOut(k));
                    }
                }
                if (Editor.changeble_elements[k]['type'] == 'opt-in-form') {
                    button_elem.css({
                        'color': '#cccccc !important'
                    });
                    $('#gen-parameters-item').after($('<li>').append(button_elem));
                } else {
                    $('#editable-elements').append($('<li>').append(button_elem));
                }
            }
        }

        for (var k in Editor.changeble_elements) {
            if (Editor.changeble_elements[k]['type'] == 'opt-in-form' && Editor.changeble_elements[k]['name-opt-in']) {
                for (i in Editor.changeble_elements[k]['elements']) {
                    var elems = $(Editor.changeble_elements[k]['elements'][i]).find('input[data-lb~="opt-in-name"]');
                    Editor.changeble_elements[k]['name-elements'].push(elems);
                    var parent_elements = $(Editor.changeble_elements[k]['elements'][i]).find('[data-lb~="opt-in-name-wrapper"]');
                    Editor.changeble_elements[k]['name-elements'].push(parent_elements);
                    if (!Editor.changeble_elements[k]['use-name']) {
                        elems.hide();
                        parent_elements.hide();
                        $('#lb-button-' + elems.attr('data-lb-id')).hide();
                    }
                }
            }
        }


        /**
         * Инициализация сайдбара
         * Инициализация фрейма
         */
        Editor.positionLeftPanel();
        $('#templete-settings').fadeIn();
        Editor.iframe.fadeIn();
    },

    /**
     * отступ сайдбара от верхней панели
     */
    positionLeftPanel: function () {
        $('#templete-settings').css('top', $('#lp-top-navigation').outerHeight() + 'px');
    },

    checkIntegrationLoadedStatus: function () {
        if (Editor.allIntegrationsLoaded()) {

            $('#lb-button-opt-in').css({
                'color': '',
                'pointer-events': 'auto'
            });
        }
    },


    /**
     * Проверяем, загружены ли все формы
     */
    allIntegrationsLoaded: function () {
        return (Editor.loadedBribeMailFiles === true && Editor.loadedAWeberForms === true && Editor.loadedMailChimpForms === true && Editor.loadedIContactForms === true && Editor.loadedInfusionsoftForms === true && Editor.loadedGetresponseForms === true && Editor.loadedGoToWebinarWebinars === true && Editor.loadedConstantContactForms === true);
        return (Editor.loadedMailChimpForms === true);
    },

    /**
     * форма подписки
     */
    editOptinForm: function (element_id) {
        if ($('#id-lp-integration-select option.integration').length <= 0) {
            $('#lp-optin-forms').hide();
            $('#lp-optin-no-forms').show();
        } else {
            $('#lp-optin-forms').show();
            $('#lp-optin-no-forms').hide();
        }

        Editor.selected_form_id = null;
        Editor.selected_form_optin = null;
        Editor.selected_form_optin_type = null;
        Editor.selected_webinar_key = null;

        var integration_type = Editor.changeble_elements[element_id]['optin_type'];

        Editor.selected_form_id = element_id;
        if (integration_type && Editor.changeble_elements[element_id]['value']) {
            Editor.selected_form_optin = Editor.changeble_elements[element_id]['value'];
            Editor.selected_form_optin_type = integration_type;
        }

        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');

        Editor.beforeOpenEditor(element_id);

        $('#lp-edit-optin-form').show();
        $('#lp-form-submit').unbind('click');


        // Opt-in Form Integration
        $('#lp-form-submit').click(function () {
            Editor.selectOptInFormSubmit();
        });

        Editor.closeEditorListener = function () {
            Editor.showHideFirstName(Editor.changeble_elements[Editor.selected_form_id]['use-name']);
            Editor.selected_form_id = null;
            Editor.selected_form_optin = null;
            Editor.selected_form_optin_type = null;
        };

        if (integration_type == 'mailchimp' || integration_type == 'infusionsoft' || integration_type == 'getresponse' || integration_type == 'icontact' || integration_type == 'constantcontact' || integration_type == 'gotowebinar') {
            $('#id-lp-integration-select').val(integration_type);
            $('#lb-' + integration_type + '-forms-select').val(Editor.changeble_elements[element_id]['value']);
            // Enter thank you page URL
            $('#id-form-typ-url').val(Editor.changeble_elements[element_id]['redirect_url']);
            // set value from sales_path
            $('#sales_path').val(Editor.changeble_elements[element_id]['sales_path']);
        }

        Editor.selected_form_id = element_id;
        if (integration_type) {
            Editor.selected_form_optin_type = integration_type;
        }
        if (Editor.changeble_elements[element_id]['value']) {
            Editor.selected_form_optin = Editor.changeble_elements[element_id]['value'];
        }

        Editor.openEditor();
        Editor.formTypeChange(true);
    },

    /**
     * редактирование текста кнопки
     */
    editSubmitButton: function (element_id) {
        var $text_input = $('#id-lp-btn-text');
        var elements = Editor.changeble_elements[element_id]['elements'];
        // шапка
        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');
        Editor.beforeOpenEditor(element_id);

        $('#lp-edit-btn-text form').validate().resetForm();
        $text_input.val(Editor.changeble_elements[element_id]['text']);
        $('#lp-form-submit').unbind('click');
        $('#lp-form-submit').click(function () {
            $('#lp-edit-btn-text form').submit();
        });
        $text_input.unbind('change');
        $text_input.unbind('keyup');
        var onchangeFn = function () {
            for (var i in elements) {
                $(elements[i]).val($text_input.val());
            }
        };
        $text_input.change(onchangeFn);
        $text_input.keyup(onchangeFn);
        Editor.closeEditorListener = function (cancel_button) {
            if (cancel_button !== true) {
                Editor.submitFormListener();
                return;
            }
            for (var i in elements) {
                $(elements[i]).val(Editor.changeble_elements[element_id]['text']);
            }
        };
        Editor.submitFormListener = function () {
            var val = $text_input.val();
            for (var i in elements) {
                $(elements[i]).val(val);
            }
            Editor.changeble_elements[element_id]['text'] = val;
            $('#lb-button-' + element_id).addClass('success');
            Editor.changeble_elements[element_id]['default_text'] = null;
            Editor.removableCheckOnsubmit(element_id);
        };
        Editor.openEditor($text_input);
    },

    // Редактрование текстового елемента
    editText: function (elem, element_id) {
        var use_live_code = false;
        if (Editor.nowEditingElement == element_id) {
            use_live_code = true;
        }
        Editor.nowEditingElement = element_id;
        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');

        var elements = Editor.changeble_elements[element_id]['elements'];
        Editor.beforeOpenEditor(element_id);
        $('#lp-form-submit').unbind('click');

        if ($(elem).is('[data-lb~="editable-rich-text"]')) {
            $('#lp-edit-rich-text form').validate().resetForm();
            $('#lp-edit-rich-text').show();
            var old_html = Editor.changeble_elements[element_id]['text'];
            var final_html = '<p>' + (use_live_code ? $(elem).html() : old_html) + '</p>';
            $('#lp-rich-text-basic').html(final_html); // вставляем в textarea текст
            $(".cke_wysiwyg_frame").contents().find('.cke_editable').html(final_html); // вставляем в редактор текст

            $('#lp-form-submit').click(function () {
                $('#lp-edit-rich-text form').submit();
            });

            var cleanAndSetCode = function (html_text) {
                html_text = html_text.replace(/<p><br><\/p>/g, '<br>');
                html_text = html_text.replace(/<\/?([a-z]+)[^>]*>/gi, function (match, tag) {
                    return (tag === "em" || tag === "strong" || tag === "a" || tag === "b" || tag === "i" || tag === "p" || tag === "br" || tag === "strike" || tag === "span" || tag === 'u') ? match : "";
                });
                html_text = html_text.replace(/^<p>/, '');
                html_text = html_text.replace(/<\/?p[^>]*>/gi, function (match) {
                    return (match == "<p>") ? "<br>" : "";
                });
                for (var i in elements) {
                    $(elements[i]).html(html_text);
                    $(elements[i]).find('a').unbind('click');
                    $(elements[i]).find('a').click(Editor.return_false);
                }
                return html_text;
            };

            Editor.closeEditorListener = function (cancel_button) {
                if (cancel_button !== true) {
                    Editor.submitFormListener();
                    return;
                }
                cleanAndSetCode(old_html);
                Editor.changeble_elements[element_id]['text'] = old_html;
                for (var i in elements) {
                    $(elements[i]).html(old_html);
                    $(elements[i]).find('a').unbind('click');
                    $(elements[i]).find('a').click(Editor.return_false);
                }
                Editor.nowEditingElement = false;
            };

            Editor.cleanAndSetBasicRichText = function () {
                cleanAndSetCode($('#lp-rich-text-basic').getCode());
                cleanAndSetCode($(".cke_wysiwyg_frame").contents().find('.cke_editable').html());
                cleanAndSetCode($('#lp-rich-text-basic').html());
            };

            Editor.submitFormListener = function () {
                var html_text = cleanAndSetCode($(".cke_wysiwyg_frame").contents().find('.cke_editable').html());
                Editor.cleanAndSetBasicRichText = function () {
                };
                Editor.closeEditorListener = function () {
                };
                Editor.removableCheckOnsubmit(element_id);
                Editor.changeble_elements[element_id]['default_text'] = null;
                Editor.changeble_elements[element_id]['text'] = html_text;
                $('#lb-button-' + element_id).addClass('success');
            };
            Editor.basicRichTextChangedResize();
            Editor.openEditor(null);
        } else {
            var $text_input = $('#id-lp-text');
            $('#lp-edit-text form').validate().resetForm();
            $('#lp-edit-text').show();
            $text_input.val(Editor.changeble_elements[element_id]['text']);
            $('#lp-form-submit').click(function () {
                $('#lp-edit-text form').submit();
            });
            $text_input.unbind('change');
            $text_input.unbind('keyup');
            var onchangeFn = function () {
                for (var i in elements) {
                    $(elements[i]).text($text_input.val());
                }
            };
            $text_input.change(onchangeFn);
            $text_input.keyup(onchangeFn);
            Editor.submitFormListener = function () {
                var val = $text_input.val();
                for (var i in elements) {
                    $(elements[i]).text(val);
                }
                Editor.changeble_elements[element_id]['text'] = val;
                Editor.changeble_elements[element_id]['default_text'] = null;
                Editor.removableCheckOnsubmit(element_id);
                $('#lb-button-' + element_id).addClass('success');
            };
            Editor.closeEditorListener = function (cancel_button) {
                if (cancel_button !== true) {
                    Editor.submitFormListener();
                    return;
                }
                for (var i in elements) {
                    $(elements[i]).text(Editor.changeble_elements[element_id]['text']);
                }
            };
            Editor.openEditor($text_input);
        }
    },

    /**
     * редактирование placeholder для формы
     */
    editPlaceHolder: function (element_id) {
        var $text_input = $('#id-lp-placeholder');
        var elements = Editor.changeble_elements[element_id]['elements'];
        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');
        Editor.beforeOpenEditor(element_id);
        $('#lp-edit-placeholder form').validate().resetForm();
        $text_input.val(Editor.changeble_elements[element_id]['title']);
        $('#lp-form-submit').unbind('click');

        $('#lp-form-submit').click(function () {
            $('#lp-edit-placeholder form').submit();
        });

        $text_input.unbind('change');
        $text_input.unbind('keyup');

        var onchangeFn = function () {
            var val = $text_input.val();
            for (var i in elements) {
                $(elements[i]).attr('title', val);
                $(elements[i]).val(val);
            }
        };
        $text_input.change(onchangeFn);
        $text_input.keyup(onchangeFn);
        Editor.closeEditorListener = function (cancel_button) {
            if (cancel_button !== true) {
                Editor.submitFormListener();
                return;
            }
            var val = Editor.changeble_elements[element_id]['title'];
            for (var i in elements) {
                $(elements[i]).attr('title', val);
                $(elements[i]).val(val);
            }
        };
        Editor.submitFormListener = function () {
            var val = $text_input.val();
            for (var i in elements) {
                $(elements[i]).attr('title', val);
                $(elements[i]).val(val);
            }
            Editor.changeble_elements[element_id]['title'] = val;
            Editor.changeble_elements[element_id]['default_text'] = null;
            $('#lb-button-' + element_id).addClass('success');
            Editor.removableCheckOnsubmit(element_id);
        };
        Editor.openEditor($text_input);
    },

    /**
     * редактирование картинок
     */
    editImage: function (element_id) {
        $('#default-image').remove();
        // Load default image
        var path_template = $('#lp-template-iframe').attr('src').replace('index.phtml', '');
        $('#lb-my-images').prepend($('<li id="default-image">').html('<a href="#" class="image-choose-btn" onclick="Editor.selectImage(this, \'' + Editor.changeble_elements[element_id]['default_url'] + '\', null);return false;"><img src="' + path_template + Editor.changeble_elements[element_id]['default_url'] + '" alt="Image"></a>'));

        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');
        Editor.beforeOpenEditor(element_id);
        var elements = Editor.changeble_elements[element_id]['elements'];
        $('#lp-form-submit').unbind('click');
        $('#lp-form-submit').click(function () {
            Editor.closeEditor();
            Editor.removableCheckOnsubmit(element_id);
            Editor.change_made = true;
            $('#lb-button-' + element_id).addClass('success');
        });
        Editor.openEditor();
        Editor.selectImage = function (btn, url, id) {
            for (var i in elements) {
                Editor.setImage(elements[i], element_id, url, id);
            }
        };
    },

    /**
     * Установить картинку
     */
    setImage: function (elem, element_id, url, id) {
        var set_basic_size = function () {
            Editor.changeble_elements[element_id]['url'] = url;
            Editor.changeble_elements[element_id]['id'] = id;
            $(elem).attr('src', url);
        };
        if (!id && url == Editor.changeble_elements[element_id]['default_url']) {
            set_basic_size();
            return;
        }
        if ($(elem).is('[data-lb*="max-image-size="]')) {
            var data_lb = $(elem).attr('data-lb').split(' ');
            var size = null;
            for (var k in data_lb) {
                if (data_lb[k].substr(0, 15) == 'max-image-size=' && data_lb[k].split('=')[1]) {
                    size = data_lb[k].split('=')[1];
                }
            }
            if (size) {
                $(elem).attr('src', url);
                // ajax загрузка картинок.
                API.apiCall({
                    data: {
                        'request': 'get-image-url',
                        'image_id': id,
                        'size': size
                    },
                    type: 'GET',
                    async: true,
                    success: function (data) {
                        Editor.changeble_elements[element_id]['url'] = data.body;
                        Editor.changeble_elements[element_id]['id'] = id;
                        $(elem).attr('src', data.body);
                    },
                    error: function () {
                        set_basic_size();
                    }
                });
            } else {
                set_basic_size();
            }
        }
    },

    /**
     * Редактируем елемент
     * активируем заголовок
     * активируем редактор
     * клик ОК
     */
    editRemovable: function (elem, element_id) {
        var elements = Editor.changeble_elements[element_id]['elements'];
        // устанавливаем заголовок редактируемого елемента с иконкой
        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');

        Editor.beforeOpenEditor(element_id);
        Editor.openEditor();

        // если нажали на Ok - закрываем редактор
        $('#lp-form-submit').click(function () {
            Editor.submitFormListener();
            Editor.closeEditor();
            return false;
        });

        Editor.submitFormListener = function () {
            Editor.removableCheckOnsubmit(element_id);
            // добавляем класс для ссылки в списке елементов
            // для разруливания активной иконки
            $('#lb-button-' + element_id).addClass('success');
        };
    },

    /**
     * редактирование картинки или ссылки
     */
    editLink: function (elem, element_id) {
        var link_only = ($(elem).is('[data-lb~="link-only"]')) ? true : false;
        var element_data = Editor.changeble_elements[element_id];
        var new_window = (Editor.changeble_elements[element_id]['new_window'] && Editor.changeble_elements[element_id]['new_window'] === true) ? true : false;
        var nofollow = (Editor.changeble_elements[element_id]['nofollow'] && Editor.changeble_elements[element_id]['nofollow'] === true) ? true : false;
        var image_url = null;
        var image_id = null;
        var old_image_url = null;
        var old_image_id = null;
        var elements = Editor.changeble_elements[element_id]['elements'];
        $('#lp-modal-header').html(Editor.changeble_elements[element_id]['name'] + ' <i class="editico ic-' + Editor.changeble_elements[element_id]['icon'] + ' pull-right"></i>');
        Editor.beforeOpenEditor(element_id);

        $('#lp-change-link form').validate().resetForm();

        $('#id-lp-link-text').val(Editor.changeble_elements[element_id]['text']);
        $('#id-lp-link-href').val(Editor.changeble_elements[element_id]['href']);
        $('#id-lp-link-target').val((new_window) ? 'yes' : 'no');
        if (new_window) {
            $('#lp-link-target-btn-yes').addClass('btn-success active');
            $('#lp-link-target-btn-no').removeClass('btn-danger active');
        } else {
            $('#lp-link-target-btn-yes').removeClass('btn-success active');
            $('#lp-link-target-btn-no').addClass('btn-danger active');
        }
        $('#id-lp-link-nofollow').val((nofollow) ? 'yes' : 'no');
        if (nofollow) {
            $('#lp-link-nofollow-btn-yes').addClass('btn-danger active');
            $('#lp-link-nofollow-btn-no').removeClass('btn-success active');
        } else {
            $('#lp-link-nofollow-btn-yes').removeClass('btn-danger active');
            $('#lp-link-nofollow-btn-no').addClass('btn-success active');
        }
        $('#lp-form-submit').unbind('click');
        $('#lp-form-submit').click(function () {
            $('#lp-change-link form').submit();
        });
        if (link_only) {
            $('#id-lp-link-text-space').hide();
        } else {
            $('#id-lp-link-text-space').show();
        }
        if (element_data['connected-image']) {
            $('#lp-change-img').show();
            $('#default-image').remove();
            old_image_id = Editor.changeble_elements[element_data['connected-image']['id']]['id'];
            old_image_url = Editor.changeble_elements[element_data['connected-image']['id']]['url'];
            $('#lb-my-images').prepend($('<li id="default-image">').html('<a href="#" class="image-choose-btn" onclick="Editor.selectImage(this, \'' + Editor.changeble_elements[element_data['connected-image']['id']]['default_url'] + '\', null);return false;"><img src="' + Editor.changeble_elements[element_data['connected-image']['id']]['default_url'] + '" alt="Image"></a>'));
            Editor.selectImage = function (btn, url, id) {
                for (var i in Editor.changeble_elements[element_data['connected-image']['id']]['elements']) {
                    Editor.setImage(Editor.changeble_elements[element_data['connected-image']['id']]['elements'][i], element_data['connected-image']['id'], url, id);
                }
                $('.image-choose-btn.active').removeClass('active');
                $(btn).addClass('active');
                image_url = url;
                image_id = id;
            };
        }
        if (Editor.target_url) {
            $('#id-lp-link-sync').show().click(function (e) {
                e.preventDefault();
                if (confirm("This will replace the URL above with this page's tracking URL. Do you wish to proceed?")) {
                    $('#id-lp-link-href').val(Editor.target_url);
                }
            });
        }
        Editor.openEditor();
        Editor.submitFormListener = function () {
            var href_val = $('#id-lp-link-href').val();
            var text_val = $('#id-lp-link-text').val();
            if (!link_only) {
                Editor.changeble_elements[element_id]['text'] = text_val;
            }
            if (element_data['connected-image'] && image_url && image_id) {
                Editor.setImage(element_data['connected-image']['elem'], element_data['connected-image']['id'], image_url, image_id);
            }
            for (var i in elements) {
                if (!link_only) {
                    $(elements[i]).text($('#id-lp-link-text').val());
                }
                $(elements[i]).attr('href', $('#id-lp-link-href').val());
            }
            Editor.changeble_elements[element_id]['href'] = href_val;
            Editor.changeble_elements[element_id]['default_text'] = null;
            Editor.changeble_elements[element_id]['new_window'] = ($('#id-lp-link-target').val() == 'yes') ? true : false;
            Editor.changeble_elements[element_id]['nofollow'] = ($('#id-lp-link-nofollow').val() == 'yes') ? true : false;
            $('#lb-button-' + element_id).addClass('success');
            Editor.removableCheckOnsubmit(element_id);
        };
        var $text_input = $('#id-lp-link-text');
        $text_input.unbind('change');
        $text_input.unbind('keyup');
        var onchangeFn = function () {
            if (!link_only) {
                var val = $text_input.val();
                for (var i in elements) {
                    $(elements[i]).text(val);
                }
            }
        };
        $text_input.change(onchangeFn);
        $text_input.keyup(onchangeFn);
        Editor.closeEditorListener = function () {
            if (!link_only) {
                var val = Editor.changeble_elements[element_id]['text'];
                for (var i in elements) {
                    $(elements[i]).text(Editor.changeble_elements[element_id]['text']);
                }
            }
            if (element_data['connected-image']) {
                for (var i in Editor.changeble_elements[element_data['connected-image']['id']]['elements']) {
                    Editor.setImage(Editor.changeble_elements[element_data['connected-image']['id']]['elements'][i], element_data['connected-image']['id'], old_image_url, old_image_id);
                }
            }
        };
    },

    /**
     * действия "Показать", "Скрыть" элемент
     */
    removableChanged: function (visible) {
        // если мы выбрали показать елемент
        if (visible) {
            $('#lp-removable-btn-yes').addClass('btn-success active');
            $('#lp-removable-btn-no').removeClass('btn-danger active');
            $('#id-lp-to-remove').val('yes');
            // выбрали скрыть елемент
        } else {
            $('#lp-removable-btn-yes').removeClass('btn-success active');
            $('#lp-removable-btn-no').addClass('btn-danger active');
            $('#id-lp-to-remove').val('no');
        }

        // вызываем функцию для отображения или сокрытия елемента
        if (Editor.selected_element_id && Editor.changeble_elements[Editor.selected_element_id] && Editor.changeble_elements[Editor.selected_element_id]['removable']) {
            Editor.showHideRemovable(Editor.selected_element_id, visible);
        }

        return false;
    },

    /**
     * проверяем после клика OK: отключили ли мы елемент или нет
     * если да - то помечаем в removed
     */
    removableCheckOnsubmit: function (element_id) {
        if (element_id && Editor.changeble_elements[element_id] && Editor.changeble_elements[element_id]['removable']) {
            Editor.changeble_elements[element_id]['removed'] = ($('#id-lp-to-remove').val() != 'yes') ? true : false;
            Editor.removableCheck(element_id);
        }
    },

    /**
     * вызываем функцию на сокрытие или отображение елемента
     */
    removableCheck: function (element_id) {
        if (element_id && Editor.changeble_elements[element_id] && Editor.changeble_elements[element_id]['removable']) {
            Editor.showHideRemovable(element_id, !Editor.changeble_elements[element_id]['removed']);
        }
    },

    // прячем или показываем елемент
    showHideRemovable: function (element_id, visible) {
        for (var i in Editor.changeble_elements[element_id]['elements']) {
            var editable_area = null;
            // если нужно спрятать то прячем
            if (!visible) {
                $(Editor.changeble_elements[element_id]['elements'][i]).hide();
                $(editable_area).hide();
                $('#lp-editor-tools-space').hide();
                // показываем елемент
            } else {
                $(Editor.changeble_elements[element_id]['elements'][i]).show();
                $(editable_area).show();
                $('#lp-editor-tools-space').show();
            }
        }
    },

    /**
     * проверяем возможность скрывать или редактировать елемент
     * и выводим комментарий елемента
     * показываем кнопку OK
     */
    beforeOpenEditor: function (element_id) {
        // прячем кнопки "Скрыть", "Показать"
        $('#lp-editor .lp-form-space').hide();
        Editor.submitFormListener = function () {
        };
        Editor.closeEditorListener = function () {
        };

        // показываем комменты если они есть
        if (element_id && Editor.changeble_elements[element_id] && Editor.changeble_elements[element_id]['comment']) {
            $('#lp-comment-text p').text(Editor.changeble_elements[element_id]['comment']);
            $('#lp-comment-text').show();
        }

        if (element_id && Editor.changeble_elements[element_id] && Editor.changeble_elements[element_id]['removable']) {
            // если елемент скрытый
            if (Editor.changeble_elements[element_id]['removed']) {
                $('#lp-removable-btn-yes').removeClass('btn-success active'); // активириуем кнопку "Показать"
                $('#lp-removable-btn-no').addClass('btn-danger active'); // активируем кнопку "Скрыть"
                $('#id-lp-to-remove').val('no');
            } else {
                $('#lp-removable-btn-yes').addClass('btn-success active');
                $('#lp-removable-btn-no').removeClass('btn-danger active');
                $('#id-lp-to-remove').val('yes');
            }
            // показываем копки "Скрыть", "Показать"
            $('#lp-removable-elem').show();
        }
        // показываем кнопку OK
        $('#lp-form-submit').show();
    },

    /**
     * показываем в левом сайдбаре блок с редактированием
     * скрываем в левом садбаре список елементов
     */
    openEditor: function ($elem_to_focus) {
        // если левый сайдбар имеет атрибут скрытости
        if ($('#templete-settings').attr('data-hidden') === 'true') {
            Editor.showEditor();
        }
        if (Editor.changeble_elements[Editor.selected_element_id]) {
            var elem = Editor.changeble_elements[Editor.selected_element_id];

            // показываем блок для редактирования картинок
            if (Editor.editor_blocks_by_type[elem['type']]) {
                $('#' + Editor.editor_blocks_by_type[elem['type']]).show();
            }
            // если возможен на редактирование и он не скрыт то показваем блок с редактором
            if (!elem['removable'] || !elem['removed']) {
                $('#lp-editor-tools-space').show();
            }
        }
        // скрываем список елементов в левом сайдбаре
        $('#lp-settings-menu').hide();
        $('#lp-editor').fadeIn(400, function () {
            if ($elem_to_focus) {
                $elem_to_focus.focus();
            }
        });
    },

    /**
     * Закрываем редактор (например, при клике на "Oтмена" вызывается функция)
     */
    closeEditor: function () {
        Editor.removableCheck(Editor.selected_element_id);
        $('#lp-editor').hide();
        $('#lp-editor-tools-space').hide();
        $('#lp-settings-menu').fadeIn();
        Editor.closeEditorListener(true);
        Editor.selected_element_id = null;
        Editor.closeEditorListener = function () {
        };
    },

    /**
     * при клике на стрелку отображать или скрывать сайдбар
     */
    editorToggle: function () {
        if ($('#lp-hide-editor-button').hasClass('disabled')) {
            return false;
        }
        if ($('#templete-settings').attr('data-hidden') === 'true') {
            Editor.showEditor();
        } else {
            Editor.hideEditor();
        }
    },

    /**
     * Прячем сайдбар
     */
    hideEditor: function () {
        var FullscreenrOptions = {
            width: 1800,
            height: 1100,
            bgID: '#bgimg'
        };
        jQuery.fn.fullscreenr(FullscreenrOptions);

        $('#lp-hide-editor-button').addClass('disabled');
        var slide_px = $('#templete-settings').width();
        $("#templete-settings").resizable('disable');
        $('#templete-settings').animate({
            left: -(slide_px)
        }, 400, function () {
            $('#lp-hide-editor-button .arrow-hide-btn').removeClass('icsw16-bended-arrow-left');
            $('#lp-hide-editor-button .arrow-hide-btn').addClass('icsw16-bended-arrow-right');
            $('#lp-hide-editor-button').removeClass('disabled');
            $('#templete-settings').attr('data-hidden', 'true');
            Editor.windowResize();
        });
        $('#lp-iframe-wrapper').animate({
            'padding-left': 0,
            'width': '100%'
        }, 400);
    },

    /**
     * показываем (с анимацией) левый сайдбар
     */
    showEditor: function () {
        var FullscreenrOptions = {
            width: 1800,
            height: 1100,
            bgID: '#bgimg'
        };
        jQuery.fn.fullscreenr(FullscreenrOptions);

        $('#lp-hide-editor-button').addClass('disabled');
        var slide_px = $('#templete-settings').width();
        $('#templete-settings').animate({
            left: 0
        }, 400, function () {
            $("#templete-settings").resizable('enable');
            $('#lp-hide-editor-button .arrow-hide-btn').removeClass('icsw16-bended-arrow-right');
            $('#lp-hide-editor-button .arrow-hide-btn').addClass('icsw16-bended-arrow-left');
            $('#lp-hide-editor-button').removeClass('disabled');
            $('#templete-settings').attr('data-hidden', 'false');
            Editor.windowResize();
        });
        $('#lp-iframe-wrapper').animate({
            'padding-left': slide_px + 'px',
            'width': ($(window).width() - slide_px) + 'px'
        }, 400);
    },


    /**
     * конвертируем русский текст в кирилицу
     *
     * @param str - входящий символ
     */
    convertUTF: function (str) {
        var space = '_';
        str = str.toLowerCase();
        var transl = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
            'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h',
            'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': space, 'ы': 'y', 'ь': space, 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        var link = '';
        for (var i = 0; i < str.length; i++) {
            if (/[а-яё]/.test(str.charAt(i))) { //если текущий символ - русская буква, то меняем его
                link += transl[str.charAt(i)];
            } else if (/[a-z0-9]/.test(str.charAt(i))) {
                link += str.charAt(i); //если текущий символ - английская буква или цифра, то оставляем как есть
            } else {
                if (link.slice(-1) !== space) link += space; // если не то и не другое то вставляем space
            }
        }
        return link;
    },


    /**
     * Валидация названия страницы для URL
     */
    cleanPageSimpleName: function (org_name) {
        var run = false;
        org_name = org_name.toLowerCase();
        org_name = Editor.convertUTF(org_name);
        if (org_name.substring(0, 1) == '-') {
            org_name = org_name.substr(1);
        }
        return $.trim(org_name);
    },

    /**
     * помечаем что название страницы отредактировано
     * выводим нотифер
     */
    markChange: function () {
        Editor.change_made = true;
        Editor.notify("warning", "You have unsaved changes...");
    },

    /**
     * Прячем уведомление
     */
    hideNotifications: function () {
        $("#notification-splitter").stop().fadeOut({
            queue: false
        });
        $("#notifications").stop().fadeOut({
            queue: false
        });
    },

    /**
     * выводим месседж на редактирование названия страницы
     */
    notify: function (type, message, timeout) {
        $("#notifications li").hide();
        $("#notifications li." + type + " span").text(message);
        $("#notifications li." + type).show();
        $("#notification-splitter").show();
        $("#notifications").show();
        if (timeout)
            setTimeout(Editor.hideNotifications, timeout);
    },

    hideValidationError: function () {
        Editor.hideNotifications();
        Editor.hasValidationError = false;
    },

    /**
     * Предпросмотр шаблона, загрузка в новый фрейм
     */
    loadPreview: function () {
        $("#lp-top-navigation").hide();
        $("<div/>").attr("id", "preview-iframe-wrapper").css("position", "absolute").appendTo("body");
        setTimeout(function () {
            var pub_url = window.location.href.replace("edit", "preview");

            $("<iframe/>").attr("src", pub_url).attr("id", "preview-iframe").css({
                "position": "absolute",
                "border": 0
            }).appendTo("#preview-iframe-wrapper").load();

            $("#remove-preview").fadeIn();
            $("#remove-preview").click(function () {
                $("li[data-state] button[data-state=edit]").click();
            });
        }, 500);
    },


    /**
     * Сохранение шаблона
     */
    uiSave: function (callback) {
        var button = $("#save-button");
        if (!$('#id_page_url').val()) {
            Editor.notify("error", "You must provide a URL for your leadpage.");
            $("#id_page_url").val("page-url");
            $("#id_page_url-span").text("page-url").click();
            return;
        }
        if (!Editor.edit && !Editor.name_changed) {
            Editor.notify("warning", "You must choose a name for your page.");
            $("#id_page_name-span").click();
            return;
        }
        if (!(button.attr("disabled"))) {
            button.attr("disabled", "disabled");

            function finishSaving(message, type) {
                if (type == "notice") {
                    Editor.saveIt(function (success) {
                        button.removeAttr("disabled");
                        button.addClass("btn-primary");
                        if (callback) callback(success);
                        Editor.notify("notice", "Выполнено!", 1500);

                        // аналитика
                        if (Editor.is_initial && analytics) {
                            analytics.track("Save Page", {
                                Template: this.template_name,
                                Page: $('#id_page_name').val()
                            });
                        }
                        // если шаблон сохранился и все прошло успешно
                        if (success) {
                            if (Editor.skip_initial) {
                                Editor.skip_initial_fn();
                                // если мы инициализруем уже сохраненный вариант шаблона
                            } else if (Editor.is_initial) {
                                if (checkSEOUrl()) {
                                    window.location.href = "/clickbuilder/landingpages/edit?id=" + Editor.template_id;
                                } else {
                                    window.location.href = "index.php?r=clickbuilder/landingpages/edit&id=" + Editor.template_id;
                                }
                            }
                        }
                    }, function () {
                        Editor.notify("notice", "Сохранение...");
                    });
                } else {
                    Editor.notify(type, message, 5000);
                    if (type == "error")
                        $("#lp-form-editor").show();
                    button.removeAttr("disabled");
                    button.addClass("btn-primary");
                }
            }

            var frame = $("#lp-form-editor")[0].contentWindow;
            if (frame.mainWindowRequestsSave) {
                frame.mainWindowRequestsSave(finishSaving);
            } else
                finishSaving("", "notice");
        }
    }
}

function randomHash(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
    if (!length) {
        length = Math.floor(Math.random() * chars.length);
    }
    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

// check SEO Friendly url
function checkSEOUrl() {
    var queryUrl = document.location.href.match(/index.php/);
    if (queryUrl == null)
        return true;
    else
        return false;
}

API = {
    apiCall: function (options) {

        var def_settings = {
            url: (checkSEOUrl()) ? ("/clickbuilder/landingpages/") : ("/index.php?r=clickbuilder/landingpages/"),
            method: '',
            data: {},
            async: true,
            type: 'POST',
            silent: false,
            success: function (data) {
            },
            complete: function () {
            },
            error: function () {
            }
        };

        var settings = $.extend(def_settings, options);
        settings.data['rand_hash'] = randomHash(32);

        var req = $.ajax({
            type: settings.type,
            url: settings.url + settings.method,
            data: settings.data,
            async: settings.async,
            dataType: 'json',
            cache: false,
            success: function (data) {
                var r_status = parseInt(data.status, 10);
                if (r_status && r_status >= 200 && r_status < 300) {
                    settings.success(data);
                } else {
                    if (!settings.silent) {
                        settings.error();
                        var msg = (data.body && data.body.message) ? data.body.message : null;
                        var title = (data.body && data.body.title) ? data.body.title : null;
                        API.ajaxError(msg, title);
                    }
                }
            },
            error: function (e, t) {
                if (t != 'abort') {
                    settings.error();
                    if (!settings.silent) {
                        API.ajaxError('', '');
                    }
                }
            },
            complete: function () {
                settings.complete();
            }
        });


        $(window).bind("beforeunload", function () {
            req.abort();
        });

        return req;
    },

    ajaxError: function (new_msg, new_title) {
        if (typeof this.ajaxErrorHandler !== "undefined") {
            return this.ajaxErrorHandler(new_msg, new_title);
        }
        var msg = 'Oops, something went wrong. Please try again later.';
        if (new_msg) {
            msg = new_msg;
        }
        var title = 'Oops, error';
        if (new_title) {
            title = new_title;
        }
        alert(msg);
    }
};