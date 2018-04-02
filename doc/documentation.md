# Documentation - WhatsApp API

All the methods and classes of the WhatsApp API are documented here for easy use.

## Table of Contents:

1. x
2. y
3. z

## The `Core` object

The `Core` object contains basic trivial methods for the WhatsApp API, and is mainly used to convert IDs to WhatsApp objects (for interactions). Even though the WhatsApp
API mostly works with identifiers (represented as strings), some functionalities would require querying data from objects, and the `Core` methods help retrieving those objects.

### `Core.group(_id : String) : GroupMetadata`

Given an identifier of a WhatsApp group, returns the object containing the group metadata.

#### Parameters

1. __id_ — the identifier of the group. Should be in the format `"<phone-num>-<group-id>@g.us"`. _(`@g.` denotes a group)_

**TODO** Write documentation for the group object.

<hr/>

### `Core.contact(_id : String) : Contact`

Given an ID of a WhatsApp contact, returns the native WhatsApp object containing the contact data.

#### Parameters

1. __id_ — the identifier of the contact. Example: `"97278656290@c.us"` _(`@c.` denotes a contact)_

**TODO** Write documentation for the contact object.

<hr/>

### `Core.chat(_id : String) : Chat`

Given an ID of a WhatsApp group or contact, returns the native WhatsApp object containing the chat data. The chat object is useful for interacting with the chat itself (sending/receiving messages, etc) while the contact/group objects are useful for interacting with the metadata of the chat (adding/removing participants, getting thumbnail picture, etc).

#### Parameters

1. __id_ — the identifier of the contact or the group.

**TODO** Write documentation for the chat object.

<hr/>

### `Core.msg(_id : String) : Msg`

Given and ID of a Msg object, returns the WhatsApp native object of the Msg. A Msg is an event fired (can be a received message, user leaves/joins group, group subject change, contact phone number change, etc). 

#### Parameters

1. __id_ — the identifier of the Msg.

**TODO** Write documentation for the Msg object.

<hr/>

## The `Listener` class

Listeners listen for events, and fire callbacks when events occur. Deductively, so does the Listener class of the WhatsApp API. The main listener instance of the API
is a member of the API class and is accessible as `API.listener`.

### Subscribing to an event

Event handlers can be attached to the listener object:

```
API.listener.ExternalHandlers.<HANDLER_NAME>.push(<EVENT_HANDLER>);
```

Where the EVENT_HANDLER is a function, and HANDLER_NAME will be described below.

### Unsubscribing from an event

Event handlers are managed using simple arrays. Removing the first attached listener, for example, for an event:

```
API.listener.ExternalHandlers.<HANDLER_NAME>.shift();
```

### `USER_JOIN_GROUP` event

Fired when a user joins a group. All subscribed event handlers are called with the parameters.

#### Parameters

1. The user that joined (contact object)
2. The user that added the user (contact object)
3. The chat the user was added to (id - string)

