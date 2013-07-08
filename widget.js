document.write('<script type="text/javascript" src="./jquery.simpleSlide.js"></script>')

DaWanda.Widget = function(options) {
  if(!options || (!options.sourceType && !options.sourceId))
    throw("Please pass a source type and a source id!")
  if(["Shop", "Pinboard"].indexOf(options.sourceType) == -1)
    throw("We currently only support a shop or a pinboard as source. Please pass a valid source type!")

  this.options = jQuery.extend({
    rows: 2,
    cols: 2,
    backgroundColorTop: "#e6e6e6",
    backgroundColorBottom: "#FFFFFF",
    innerbackgroundColor: "#FFFFFF",
    borderWidth: 10,
    linkColor: "#267ED5",
    textColor: "#5d5d5d",
    autoSlide: false,
    imageVersion: "listview",
    sourceType: "Pinboard",
    sourceId: 640662,
    hideProductInformation: false,
    title: '',
    language: 'de',
    hideLogo: false,
    titleFontSize: 12,
    uuid: 'old-installation',
    containerElement: null,
    responsiveImageWidth: false
  }, options)

  this.api = new DaWanda.API("c140e138d812449959a6d5a7b0d8258197edeb58", this.options.language)
}

var inGroupsOf = function(array, count) {
  if((typeof count == "undefined") || (parseInt(count) <= 0)) return []
  var result = []

  for(var i = 0; i < array.length; i++) {
    var resultIndex = parseInt(i / count)
    if(typeof result[resultIndex] == "undefined") result.push([])
    result[resultIndex].push(array[i])
  }

  return result
}

DaWanda.Widget.prototype = {
  getUniqueContainerId: function(prefix) {
    var result = prefix, i = 1
    while(jQuery("#" + result).length > 0)
      result = prefix + ++i
    return result
  },

  getInsertPoint: function() {
    if (this.options.containerElement != null) {
      return jQuery(this.options.containerElement)

    } else {
      var result = null
      var self = this
      jQuery("script").each(function() {
        if((this.text.indexOf("new DaWanda.Widget({") > -1) && (this.text.indexOf(self.options.sourceId.toString()) > -1))
          result = this
      })
      return result
    }
  },

  imageWidth: function() {
    return (parseInt(this.options.imageWidth) != 0) ? this.options.imageWidth : ''
  },

  getImageUrl: function(product) {
    var imageUrl = product.default_image[this.options.imageVersion]

    if(imageUrl.indexOf("http://") == -1)
      imageUrl = "http://de.dawanda.com" + imageUrl

    return imageUrl
  },

  render: function() {
    var widget = this
    var sourceType = this.options.sourceType
    var productRequestOptions = {
      onSuccess: function(data) {
        widget.products = data.result.products

        if(widget.readyForRendering()) widget.renderCallback()
      },
      params: { per_page: 100 }
    }
    var sourceRequestOptions = {
      onSuccess: function(data) {
        widget.source = data.result[sourceType.toLowerCase()]
        widget.userId = data.result[sourceType.toLowerCase()].user.id

        if(widget.readyForRendering()) widget.renderCallback()
      }
    }

    this.api["getProductsFor" + sourceType](this.options.sourceId, productRequestOptions)
    this.api["get" + sourceType + "Details"](this.options.sourceId, sourceRequestOptions)
  },

  renderCallback: function() {
    var image = new Image()
    var self = this
    image.onload = function() {
      if (self.options.responsiveImageWidth == true) {
        self.options.imageWidth = (self.getInsertPoint().width() - 2) / 2 - 2*10
      } else {
        self.options.imageWidth = image.width
      }
      self.renderProducts()
    }
    image.src = this.getImageUrl(this.products[0])
  },

  readyForRendering: function() {
    return (typeof this.products != "undefined") && (typeof this.source != "undefined")
  },

  renderProduct: function(product, productIndex) {
    var productImage = this.getImageUrl(product)
    if(productImage.indexOf("http://") == -1)
      productImage = "http://de.dawanda.com" + productImage

    var result =  '' +
    '<td valign="top" width="' + this.imageWidth() + '">' +
    '  <a target="_blank" href="' + this.addTrackingCode(product.product_url) + '" style="padding: 0px; margin: 0px;">' +
    '    <img src="' + productImage + '" width="' + this.imageWidth() + '" />' +
    '  </a>'

    if (!eval(this.options.hideProductInformation)) {
      result += '' +
      '  <div class="productInformation"><a target="_blank" href="' + this.addTrackingCode(product.product_url) + '">' + product.name + '</a></div>' +
      '  <span class="dawandaWidgetSmall">' +
      '    <a target="_blank" href="' + this.addTrackingCode('http://' + this.options.language + '.dawanda.com/user/' + product.user.name) + '">' + product.user.name + '</a>' +
      '  </span>'
    }

    result += '</td>'

    return result
  },

  renderProductRow: function(productRow, rowIndex) {
    var _this = this
    var result = '' +
    '<tr>' +
      jQuery.map(productRow, function(product, index) {
        return _this.renderProduct(product, index)
      }).join("") +
    '</tr>'

    return result
  },

  renderProductGroup: function(productGroup, groupIndex) {
    var _this = this
    var result = '' +
    '<div class="simpleSlide-slide" rel="' + this.options.sourceId +'" alt="' + groupIndex + '">' +
    '  <table border="0" width="100%" cellspacing="0" cellpadding="0" class="productGroupTable">' +
        jQuery.map(
          inGroupsOf(productGroup, parseInt(_this.options.cols)),
          function(row, index) { return _this.renderProductRow(row, index) }
        ).join("") +
    '  </table>' +
    '</div>'

    return result
  },

  renderProducts: function() {
    var showNormalVersion = ((this.options.cols >= 3) || ((this.options.imageVersion != 'thumb') && (this.options.imageVersion != 'listing')))
    var _this = this
    var result = '' +
      '<div id="dawandaWidgetContainer">' +
      ' <div id="dawandaWidgetInnerContainer">' +
      (eval(this.options.autoSlide) ? '    <div class="auto-slider" rel="' + this.options.sourceId +'"></div>' : '') +
      '   <table border="0" cellspacing="0" cellpadding="0" width="100%">' +
      '     <tr>' +
      '       <td class="dawandaWidgetContent" colspan="2">' +
      '         <div id="dawandaWidgetHeadline" style="' + (showNormalVersion ? '' : 'height: 20px') + '">'

      if(!eval(this.options.hideLogo))
        result += '' +
          '<a href="' + this.addTrackingCode('http://' + this.options.language + '.dawanda.com') + '" target="_blank">' +
          '  <img src="http://de.dawanda.com/images/newsletter/logo.png" width=100 style="vertical-align: middle;" />' +
          '</a>'

      if(showNormalVersion)
        result += '<a target="_blank" href="' + this.getSourceURL() + '" id="dawandaWidgetTitle">' + this.options.title + '</a>'

      result+= '' +
      '         </div>'+
      '         <div class="simpleSlide-window" rel="' + this.options.sourceId +'">' +
      '           <div class="simpleSlide-tray" rel="' + this.options.sourceId +'">' +
                    jQuery.map(
                      inGroupsOf(_this.products, parseInt(_this.options.rows) * parseInt(_this.options.cols)),
                      function(group, index) { return _this.renderProductGroup(group, index) }
                    ).join("") +
      '           </div>' +
      '         </div>' +
      '       </td>' +
      '     </tr>' +
      '     <tr>'+
      '       <td style="padding: 10px 0px 10px 10px;">' +
      '         <div class="left-button" rel="' + this.options.sourceId +'" style="cursor: pointer;' + (_this.showPagination() ? '' : 'display: none') + '"> ' +
      '           <img src="http://de.dawanda.com/images/v3/slider/arrow_left.gif" style="border: none" />' +
      '         </div>' +
      '       </td>' +
      '       <td style="padding: 10px 10px 10px 0px;" align="right">' +
      '         <div class="right-button" rel="' + this.options.sourceId +'" style="cursor: pointer;' + (_this.showPagination() ? '' : 'display: none') + '">' +
      '           <img src="http://de.dawanda.com/images/v3/slider/arrow_right.gif" style="border: none" />' +
      '         </div>' +
      '       </td>' +
      '     </tr>' +
      '   </table>' +
      ' </div>' +
      ' <img src="http://t.dawanda.com/_t_/?t=js_widget&src_id='+ this.options.sourceId +'&src_type='+ this.options.sourceType +'&rand='+ this.options.uuid +'" alt="DaWanda JS-Widget" />' +
      '</div>'

      _this.containerId = _this.getUniqueContainerId("dawandaWidgetOuterContainer")
      if (this.options.containerElement != null) {
        jQuery(this.getInsertPoint()).attr("id", _this.containerId).append(result)
      } else {
        jQuery(this.getInsertPoint()).after(jQuery("<div></div>").attr("id", _this.containerId).append(result))
      }
      _this.renderCss()

      window.setTimeout(function() {
        simpleSlide({
          callback: function() {
            jQuery("#" + _this.containerId + " .simpleSlide-slide").css('width', ((_this.options.imageWidth + 20) * parseInt(_this.options.cols)))
          }
        })

        if(jQuery("#" + _this.containerId + " .auto-slider").length > 0) {
          jQuery("#" + _this.containerId + " .auto-slider").each( function() {
            var related_group = jQuery(this).attr('rel')
            window.setInterval("simpleSlideAction('.right-button', " + related_group + ");", 4000)
          })
        }
      }, 500)
  },

  paginationNeeded: function() {
    return (this.products.length > (parseInt(this.options.cols) * parseInt(this.options.rows)))
  },

  showPagination: function() {
    return !(eval(this.options.autoSlide)) && this.paginationNeeded()
  },

  getSourceURL: function() {
    var result = null

    if(this.options.sourceType == "Pinboard")
      result = "http://dawanda.com/list/#{user}/#{sourceId}-#{sourceName}"
    else
      result = "http://dawanda.com/shop/#{subdomain}"

    return this.addTrackingCode(
      result
        .replace("#{user}", this.source.user.name)
        .replace("#{sourceId}", this.source.id)
        .replace("#{sourceName}", this.source.name)
        .replace("#{subdomain}", this.source.subdomain)
    )
  },

  addTrackingCode: function(url) {
    var params = [
      'utm_source=Widget',
      'utm_medium=Widget-JS',
      ('utm_campaign=' + this.options.cols + 'Sx' + this.options.rows + 'Rx' + this.options.imageVersion.toUpperCase()),
      'utm_term=widget_' + this.userId,
      'utm_content=' + this.options.uuid
    ].join("&")

    if(url.indexOf("?") > -1)
      return url + params
    else
      return url + "?" + params
  },

  renderCss: function() {
    var widgetWidth = ((this.options.imageWidth + 20) * parseInt(this.options.cols))

    var reset = "                                                                                                                                                                           \
      %{containerId} div, %{containerId} span, %{containerId} h1, %{containerId} h2, %{containerId} h3, %{containerId} h4, %{containerId} h5, %{containerId} h6, %{containerId} p,          \
      %{containerId} blockquote, %{containerId} pre, %{containerId} a, %{containerId} abbr, %{containerId} acronym, %{containerId} address, %{containerId} big, %{containerId} cite,        \
      %{containerId} code, %{containerId} del, %{containerId} dfn, %{containerId} em, %{containerId} font, %{containerId} img, %{containerId} ins, %{containerId} kbd, %{containerId} q,    \
      %{containerId} s, %{containerId} samp, %{containerId} small, %{containerId} strike, %{containerId} strong, %{containerId} sub, %{containerId} sup, %{containerId} tt,                 \
      %{containerId} var, %{containerId} b, %{containerId} u, %{containerId} i, %{containerId} center, %{containerId} dl, %{containerId} dt, %{containerId} dd, %{containerId} ol,          \
      %{containerId} ul, %{containerId} li, %{containerId} fieldset, %{containerId} form, %{containerId} label, %{containerId} legend, %{containerId} table, %{containerId} caption,        \
      %{containerId} tbody, %{containerId} tfoot, %{containerId} thead, %{containerId} tr, %{containerId} th, %{containerId} td {                                                           \
        margin: 0;                                                                                                                                                                          \
        padding: 0;                                                                                                                                                                         \
        border: 0;                                                                                                                                                                          \
        outline: 0;                                                                                                                                                                         \
        font-size: 100%;                                                                                                                                                                    \
        vertical-align: baseline;                                                                                                                                                           \
        background: transparent;                                                                                                                                                            \
        line-height: 1;                                                                                                                                                                     \
      }                                                                                                                                                                                     \
      %{containerId} ol, %{containerId} ul {                                                                                                                                                \
        list-style: none;                                                                                                                                                                   \
      }                                                                                                                                                                                     \
      %{containerId} blockquote, %{containerId} q {                                                                                                                                         \
        quotes: none;                                                                                                                                                                       \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} :focus {                                                                                                                                                               \
        outline: 0;                                                                                                                                                                         \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} ins {                                                                                                                                                                  \
        text-decoration: none;                                                                                                                                                              \
      }                                                                                                                                                                                     \
      %{containerId} del {                                                                                                                                                                  \
        text-decoration: line-through;                                                                                                                                                      \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} table {                                                                                                                                                                \
        border-collapse: collapse;                                                                                                                                                          \
        border-spacing: 0;                                                                                                                                                                  \
      }                                                                                                                                                                                     \
    "

    var result = "                                                                                                                                                                          \
      %{containerId} #dawandaWidgetContainer {                                                                                                                                              \
    "
    if (this.options.backgroundPattern)
      result += "background: url(http://de.dawanda.com/widget/v2/background_patterns/" + this.options.backgroundPattern + ");                                                               \
      "
    else
      result += "                                                                                                                                                                           \
        background: " + this.options.backgroundColorTop +";                                                                                                                                 \
        filter: progid:DXImageTransform.Microsoft.gradient (startColorstr=" + this.options.backgroundColorTop+ ", endColorstr=" + this.options.backgroundColorBottom + ");                  \
        background: -moz-linear-gradient(90deg, " + this.options.backgroundColorBottom + ", "+ this.options.backgroundColorTop+ ");                                                         \
        background: -webkit-gradient( linear, left bottom, left top, color-stop(0, " + this.options.backgroundColorBottom + "), color-stop(1, "+ this.options.backgroundColorTop +") );     \
      "

    result += "                                                                                                                                                                             \
        padding: "+ this.options.borderWidth + "px;                                                                                                                                         \
        width: "+ widgetWidth +"px;                                                                                                                                                         \
        font-family: Arial;                                                                                                                                                                 \
        font-size: 12px;                                                                                                                                                                    \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer {                                                                                                                                              \
        position: relative;                                                                                                                                                                 \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer, %{containerId} #dawandaWidgetContainer table {                                                                                                \
        color: "+ this.options.textColor +";                                                                                                                                                \
        font-size: 12px;                                                                                                                                                                    \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer .productGroupTable td {                                                                                                                        \
        padding: 10px;                                                                                                                                                                      \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer a.productTitle {                                                                                                                               \
        display:block;                                                                                                                                                                      \
        height: 16px;                                                                                                                                                                        \
        margin-top:5px;                                                                                                                                                                     \
        overflow:hidden;                                                                                                                                                                    \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetInnerContainer {                                                                                                                                         \
        background-color: " + this.options.innerBackgroundColor +";                                                                                                                         \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetHeadline {                                                                                                                                               \
        font-family: Arial;                                                                                                                                                                 \
        font-size: " + this.options.titleFontSize + "px;                                                                                                                                    \
        margin-left: 10px;                                                                                                                                                                  \
        font-weight: bold;                                                                                                                                                                  \
        margin-bottom: 7px;                                                                                                                                                                 \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetTitle {                                                                                                                                                  \
        display: block;                                                                                                                                                                     \
        width: " + (widgetWidth - (eval(this.options.hideLogo) ? 20 :  120)) + "px;                                                                                                                                               \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetHeadline a {                                                                                                                                             \
        color: " + this.options.textColor + " !important;                                                                                                                                   \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetHeadline img {                                                                                                                                           \
        border: none !important;                                                                                                                                                            \
        position: absolute;                                                                                                                                                                 \
        right: 4px;                                                                                                                                                                         \
        top: 4px;                                                                                                                                                                           \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetInnerContainer a {                                                                                                                                       \
        color: "+ this.options.linkColor +";                                                                                                                                                \
        text-decoration: none;                                                                                                                                                              \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer .dawandaWidgetSmall {                                                                                                                          \
        font-size: 10px;                                                                                                                                                                    \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer .dawandaWidgetSmall a {                                                                                                                        \
        color: "+ this.options.textColor +" !important;                                                                                                                                     \
        line-height: 14px;                                                                                                                                                                  \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetInnerContainer td img {                                                                                                                                  \
        border: none;                                                                                                                                                                       \
        padding: 0px;                                                                                                                                                                       \
        margin: 0px;                                                                                                                                                                        \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetFooter {                                                                                                                                                 \
        font-size: 12px;                                                                                                                                                                    \
        float: right;                                                                                                                                                                       \
        font-weight: bold;                                                                                                                                                                  \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer .productInformation {                                                                                                                          \
        height: 30px;                                                                                                                                                                       \
        overflow: hidden;                                                                                                                                                                   \
        line-height: 15px;                                                                                                                                                                  \
        width: " + this.imageWidth() + "px;                                                                                                                                                   \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} #dawandaWidgetContainer .productInformation a {                                                                                                                        \
        line-height: 15px;                                                                                                                                                                  \
      }                                                                                                                                                                                     \
                                                                                                                                                                                            \
      %{containerId} .dawandaWidgetContent {                                                                                                                                                \
        padding: 15px 0px 0px 0px;                                                                                                                                                          \
      }                                                                                                                                                                                     \
      "

    var linkPadding = [5, this.options.borderWidth, this.options.borderWidth, this.options.borderWidth, ""].join("px ")
    jQuery(this.getInsertPoint()).parent().children(".DaWandaWidgetCopyright").css('width', widgetWidth).css("padding", linkPadding)
    jQuery("head").append(jQuery("<style type='text/css' media='screen'>" + reset.replace(/%\{containerId\}/g, "#" + this.containerId) + "</style>"))
    jQuery("head").append(jQuery("<style type='text/css' media='screen'>" + result.replace(/%\{containerId\}/g, "#" + this.containerId) + "</style>"))
  }
}

if(!Array.indexOf){
  Array.prototype.indexOf = function(obj){
    for(var i=0; i<this.length; i++){
      if(this[i]==obj) return i
    }
    return -1;
  }
}
