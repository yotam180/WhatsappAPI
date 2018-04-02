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

1. __id_ — the identifier of the group. Should be in the format `"<phone-num>-<group-id>@g.us"`.

#### Return value:

The group object.

**TODO** Write documentation for the group object.
