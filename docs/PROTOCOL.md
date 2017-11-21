# Communication protocol between the host and WhatsBot&trade;

## Command message

Will be formatted as a JSON encoded string

```json
{
    type: "cmd",
    cmd: "<one of the available commands>",
    msg_id: "<string identifier of the message>",
    args: 
    {
        <arguments>
    }
}
```

### commands and arguments

<table>
  <tr>
    <td><b>cmd</b></td>
    <td><b>argument</b></td>
    <td><b>type</b></td>
    <td><b>description</b></td>
  </tr>
  <tr>
    <td rowspan="2"><b>send_message_to_num</b><br/><br/>Sends a text message to a specified phone number. The phone number must be on your contact list or chat list.</td>
    <td> number </td>
    <td>string</td>
    <td>The phone number you want to send the message to, formatted `CCXXXXXX` (no dashes, parentheses, etc.)</td>
  </tr>
  <tr>
    <td> message </td>
    <td>string</td>
    <td>The content of the message</td>
  </tr>
</table>

## Response message

Will be formatted as a JSON encoded string

```json
{
    type: "response",
    msg_id: "<string identifier of the original message>",
    args: 
    {
        <arguments>
    }
}
```

## Events

To be implemented