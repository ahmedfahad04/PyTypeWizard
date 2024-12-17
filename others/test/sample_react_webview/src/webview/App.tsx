import React, { useEffect, useState } from 'react';
import './index.css';

const App: React.FC = () => {
	const [message, setMessage] = useState('Waiting for data...');
	const [timestamp, setTimestamp] = useState('');

	useEffect(() => {
		// Listen for messages from VS Code
		window.addEventListener('message', (event) => {
			const message = event.data;
			switch (message.command) {
				case 'init':
					setMessage(message.data.message);
					setTimestamp(message.data.timestamp);
					break;
			}
		});
	}, []);

	const sendMessageToVSCode = () => {
		// Send message back to VS Code
		window.parent.postMessage({
			command: 'log',
			text: 'Message from React Webview!',
		}, '*');
	};

	return (
		<div className='min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center'>
			<div className='bg-white p-8 rounded-lg shadow-md w-96'>
				<h1 className='text-2xl font-bold mb-4 text-center'>
					VS Code React Extension
				</h1>
				<div className='bg-blue-100 p-4 rounded-md mb-4'>
					<p className='text-blue-800'>{message}</p>
					<p className='text-sm text-blue-600 mt-2'>Timestamp: {timestamp}</p>
				</div>
				<button
					onClick={sendMessageToVSCode}
					className='w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300'
				>
					Send Message to VS Code
				</button>
			</div>
		</div>
	);
};

export default App;
