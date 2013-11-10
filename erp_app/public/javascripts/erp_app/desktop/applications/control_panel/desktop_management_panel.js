Ext.define("Compass.ErpApp.Desktop.Applications.ControlPanel.DesktopManagementPanel",{
  extend:"Ext.Panel",
  requires:['Ext.ux.desktop.Wallpaper'],
  alias:"widget.controlpanel_desktopmanagementpanel",
  setWindowStatus : function(status){
    this.findParentByType('statuswindow').setStatus(status);
  },
    
  clearWindowStatus : function(){
    this.findParentByType('statuswindow').clearStatus();
  },

  setup:function(){
    this.form.setup();
  },

  buildPreferenceForm: function(form, preferenceTypes){
    var self = this;
    form.removeAll(true);

    Ext.each(preferenceTypes, function(preferenceType){
      var store = []
      Ext.each(preferenceType.preference_options,function(option){
        store.push([option.value,option.description])
      });

      if(preferenceType.internal_identifier == 'desktop_background')
      {
        form.add({
          xtype:'combo',
          fieldLabel:preferenceType.description,
          editable:false,
          forceSelection:true,
          id:preferenceType.internal_identifier + '_id',
          width:150,
          triggerAction: 'all',
          store:store,
          name:preferenceType.internal_identifier,
          listeners:{
            scope:self,
            'select':function(combo){
              self.wallpaperImageChange(combo.getValue());
            }
          }
        });
      }
      else
      {
        form.add({
          xtype:'combo',
          editable:false,
          forceSelection:true,
          id:preferenceType.internal_identifier + '_id',
          fieldLabel:preferenceType.description,
          name:preferenceType.internal_identifier,
          valueField:'field1',
          width:150,
          triggerAction: 'all',
          store:store
        });
      }

    });
  },

  setPreferences: function(preferences){
    var preference = preferences.find("preference_type.internal_identifier == 'desktop_background'");
    var wallpaper = preference.preference_option.value;
    var img = Ext.get('wallpaper_background_image').dom;
    img.src = "/images/wallpaper/" + wallpaper;
  },

  wallpaperImageChange: function(selectedImage){
    var img = Ext.get('wallpaper_background_image').dom;
    img.src = "/images/wallpaper/" + selectedImage;
  },

  constructor : function(config) {
    var self = this;
    var backgroundImagePanel = {
      layout:'fit',
      width:150,
      xtype:'panel',
      region:'east',
      html:'<div style="padding:5px;text-align:center"><span>Preview</span><br/><img height=140 width=140 id="wallpaper_background_image" src="" /><br/></div>'
    }

    this.form = Ext.create('Compass.ErpApp.Shared.Preferences.Form',{
      url:'/erp_app/desktop/control_panel/desktop_management/update_desktop_preferences',
      setupPreferencesUrl:'/erp_app/desktop/control_panel/desktop_management/desktop_preferences',
      loadPreferencesUrl:'/erp_app/desktop/control_panel/desktop_management/selected_desktop_preferences',
      width:350,
      defaults:{
        width:150
      },
      region:'center',
      listeners:{
        'beforeAddItemsToForm':function(form, preferenceTypes){
          self.buildPreferenceForm(form, preferenceTypes);
          return false;
        },
        'beforeSetPreferences':function(form,preferences){
          self.setPreferences(preferences);
        },
        'afterUpdate':function(form, preferences){
          var preference = preferences.find("preference_type.internal_identifier == 'desktop_background'");
          compassDesktop.getDesktop().setWallpaper("/images/wallpaper/" + preference.preference_option.value, true);
          var old_theme_preference = form.preferences.find("preference_type.internal_identifier == 'extjs_theme'");
          var theme_preference = preferences.find("preference_type.internal_identifier == 'extjs_theme'");
          if(old_theme_preference.preference_option.value != theme_preference.preference_option.value){
            Compass.ErpApp.Utility.promptReload();
            return false;
          }
          else{
            return true;
          }
          
        }
      }
    });

    config = Ext.apply({
      title:'Desktop',
      items:[this.form,backgroundImagePanel],
      layout:'border',
      tbar:{
        items:{
          iconCls:'icon-picture',
          text:'Add Background',
          handler:function(btn){
            var addBackgroundWindow = new Ext.Window({
              layout:'fit',
              width:340,
              title:'Add Background',
              height:130,
              plain: true,
              buttonAlign:'center',
              items: new Ext.FormPanel({
                frame:false,
                fileUpload: true,
                bodyStyle:'padding:5px 5px 0',
                width: 425,
                defaults:{
                  labelWidth:110
                },
                url:'/erp_app/desktop/control_panel/desktop_management/add_background',
                items:[
                {

                  xtype:'textfield',
                  fieldLabel:'Description',
                  allowBlank:true,
                  name:'description'
                },
                {
                  xtype:'filefield',
                  fieldLabel:'Background Image',
                  buttonText:'Upload',
                  buttonOnly:false,
                  allowBlank:false,
                  name:'image_data'
                }
                ]
              }),
              buttons: [{
                text:'Submit',
                listeners:{
                  'click':function(button){
                    var window = button.findParentByType('window');
                    var formPanel = window.query('form')[0];
                    self.setWindowStatus('Adding background...');
                    formPanel.getForm().submit({
                      reset:true,
                      success:function(form, action){
                        self.clearWindowStatus();
                        var obj =  Ext.decode(action.response.responseText);
                        if(obj.success){
                          self.setup();
                        }
                        else{
                          Ext.Msg.alert("Error", obj.msg);
                        }
                      },
                      failure:function(form, action){
                        self.clearWindowStatus();
                        if(action.response !== undefined){
                          var obj =  Ext.decode(action.response.responseText);
                          Ext.Msg.alert("Error", obj.msg);
                        }
                        else{
                          Ext.Msg.alert("Error", 'Error adding background.');
                        }
                      }
                    });
                  }
                }
              },{
                text: 'Close',
                handler: function(){
                  addBackgroundWindow.close();
                }
              }]
            });
            addBackgroundWindow.show();
          }
        }
      }
    }, config);

    this.callParent([config]);
  }
});






