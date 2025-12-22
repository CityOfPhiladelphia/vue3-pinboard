class RecordingsClient {
  constructor(baseUrl, username, password, srid = 3857, proxy) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.srid = srid;
    this.proxy = proxy;
  }

  // this takes map bounds and an EPSG coordinate system id, e.g. 3857
  // and returns an array of cyclomedia recording points
  async getRecordings(bounds, callback) {
    if (import.meta.env.VITE_DEBUG) console.log('recordings-client.js, getRecordings is running, bounds:', bounds);

    const swCoord = bounds.getSouthWest();
    const neCoord = bounds.getNorthEast();
    const requestXml = `<wfs:GetFeature service="WFS" version="1.1.0" resultType="results" outputFormat="text/xml; subtype=gml/3.1.1" xmlns:wfs="http://www.opengis.net/wfs">
											<wfs:Query typeName="atlas:Recording" srsName="EPSG:${this.srid}" xmlns:atlas="http://www.cyclomedia.com/atlas">
												<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
						    					<ogc:And>
						      					<ogc:BBOX>
											        <gml:Envelope srsName="EPSG:${this.srid}" xmlns:gml="http://www.opengis.net/gml">
											          <gml:lowerCorner>${swCoord.lng} ${swCoord.lat}</gml:lowerCorner>
											          <gml:upperCorner>${neCoord.lng} ${neCoord.lat}</gml:upperCorner>
											        </gml:Envelope>
											      </ogc:BBOX>
											      <ogc:PropertyIsNull>
											        <ogc:PropertyName>expiredAt</ogc:PropertyName>
											      </ogc:PropertyIsNull>
											    </ogc:And>
											  </ogc:Filter>
											 </wfs:Query>
											</wfs:GetFeature>`;
    const url = (this.proxy || '') + this.baseUrl;

    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Authorization': 'Basic ' + window.btoa(this.username + ':' + this.password),
      },
      body: requestXml
    }
    try {
      const response = await fetch(url, request)
      const data = await response.text()
      const responseXml = new window.DOMParser().parseFromString(data, "text/xml")
      const recordingEls = [].slice.call(responseXml.getElementsByTagNameNS('*', 'Recording'));

      // check for > 1
      if (recordingEls.length < 1) {
        if (import.meta.env.VITE_DEBUG) console.log('no cyclomedia recordings for bounds');
        return;
      }

      const recordings = recordingEls.map(recordingEl => {
        const imageId = recordingEl.getElementsByTagNameNS('*', 'imageId')[0].firstChild.data;
        const coords = recordingEl.getElementsByTagNameNS('*', 'pos')[0].firstChild.data;
        const [lng, lat] = coords.split(' ').map(parseFloat);
        return {
          imageId,
          lng,
          lat,
        };
      });

      callback(recordings);
    } catch (error) {
      console.error(error)
    }
  }
}

export default RecordingsClient;
