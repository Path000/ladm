# ladm

pm2 ecosystem

```javascript
module.exports = {
	apps: [{
		name: 'site-ladm',
		script: 'index.js',
		instances: 1,
		exec_mode: 'fork',
		time: true
	}, {
		name: 'media-ladm',
		script: 'media.js',
		instances: 1,
		exec_mode: 'fork',
		time: true
	}, {
		name: 'worker-ladm',
		script: 'worker.js',
		instances: 1,
		exec_mode: 'fork',
		time: true
	}, {
		name: 'pcloud-intercept-ladm',
		script: 'pcloud-interceptor.js',
		instances: 1,
		exec_mode: 'fork',
		time: true
	}]
}
```

![LADM](/ladm.png)
