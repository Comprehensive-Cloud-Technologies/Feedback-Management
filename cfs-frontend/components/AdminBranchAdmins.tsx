import React, { useEffect, useState } from 'react';
import { getEndpoints } from '../constants';

interface BranchAdmin {
	id: number;
	site: string;
	username: string;
	logo?: string;
}

interface Site {
	id: number;
	location: string;
}

const AdminBranchAdmins: React.FC = () => {
	const [sites, setSites] = useState<Site[]>([]);
	const [admins, setAdmins] = useState<BranchAdmin[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notification, setNotification] = useState<string | null>(null);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => setError(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const token = localStorage.getItem('canteenAdminJWT') || '';
	const endpoints = getEndpoints();

	const showNotification = (msg: string) => {
		setNotification(msg);
		setTimeout(() => setNotification(null), 3000);
	};

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		try {
			const headers = {
				'Authorization': `Bearer ${token}`,
				'X-Token': token,
				'Accept': 'application/json'
			};

			const [sitesRes, adminsRes] = await Promise.all([
				fetch(endpoints.SITES, { headers }),
				fetch(endpoints.ADMIN_BRANCH_ADMINS, { headers })
			]);

			if (!sitesRes.ok || !adminsRes.ok) throw new Error('Failed to fetch data');

			const sitesData = await sitesRes.json();
			const adminsData = await adminsRes.json();

			setSites(Array.isArray(sitesData.sites) ? sitesData.sites : []);
			setAdmins(Array.isArray(adminsData.branch_admins) ? adminsData.branch_admins : []);
		} catch (e: any) {
			setError(e.message || 'Failed to load data');
		}
		setLoading(false);
	};

	useEffect(() => { fetchData(); }, []);

	const handleCreate = async () => {
		const site = (document.getElementById('adminSiteSelect') as HTMLSelectElement).value;
		const username = (document.getElementById('adminUsername') as HTMLInputElement).value.trim();
		const password = (document.getElementById('adminPassword') as HTMLInputElement).value;

		if (!site || !username || !password) return alert('Please fill all fields');

		setLoading(true);
		try {
			const res = await fetch(endpoints.ADMIN_BRANCH_ADMINS, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'X-Token': token,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ site, username, password })
			});

			if (res.ok) {
				(document.getElementById('adminUsername') as HTMLInputElement).value = '';
				(document.getElementById('adminPassword') as HTMLInputElement).value = '';
				await fetchData();
				showNotification('Branch Admin created! 🎉');
			} else {
				const d = await res.json();
				alert(d.error || 'Failed to create');
			}
		} catch (e) {
			alert('An error occurred');
		}
		setLoading(false);
	};

	const handleDelete = async (id: number, username: string) => {
		if (!confirm(`Delete admin "${username}"?`)) return;

		setLoading(true);
		try {
			const res = await fetch(`${endpoints.ADMIN_BRANCH_ADMINS}?id=${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'X-Token': token
				}
			});

			if (res.ok) {
				await fetchData();
				showNotification('Admin deleted.');
			} else {
				const d = await res.json();
				alert(d.error || 'Failed to delete');
			}
		} catch (e) {
			alert('An error occurred');
		}
		setLoading(false);
	};

	const handleEditLogo = async (admin: BranchAdmin) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			// Convert to base64
			const reader = new FileReader();
			reader.onload = async (event) => {
				const base64Logo = event.target?.result as string;

				setLoading(true);
				try {
					const res = await fetch(endpoints.ADMIN_BRANCH_ADMINS, {
						method: 'PUT',
						headers: {
							'Authorization': `Bearer ${token}`,
							'X-Token': token,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ site: admin.site, logo: base64Logo })
					});

					if (res.ok) {
						await fetchData();
						showNotification('Logo updated successfully! 🎨');
					} else {
						const d = await res.json();
						setError(d.error || 'Failed to update logo');
					}
				} catch (e: any) {
					setError(e.message || 'An error occurred while uploading logo');
				}
				setLoading(false);
			};
			reader.readAsDataURL(file);
		};
		input.click();
	};

	return (
		<div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl mt-6">
			{/* Toast Notification Container in Top-Right Corner */}
			<div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md">
				{notification && (
					<div className="pointer-events-auto bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-green-500 animate-fade-in-down">
						<span className="text-xl">✅</span>
						<span className="font-semibold text-sm">{notification}</span>
					</div>
				)}
				{error && (
					<div className="pointer-events-auto bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-red-500 animate-fade-in-down">
						<div className="flex items-center gap-2">
							<span className="text-xl">❌</span>
							<span className="font-semibold text-sm">{error}</span>
						</div>
						<button onClick={() => setError(null)} className="text-white hover:text-gray-200 text-lg font-bold ml-2">×</button>
					</div>
				)}
			</div>

			<div className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-lg py-3 mb-6 shadow flex items-center justify-between px-4">
				<h2 className="text-xl font-bold text-white flex items-center gap-2">
					<span>👥</span> Branch Admin Accounts Management
				</h2>
				<span className="text-white font-semibold text-base">Total Admins: {admins.length}</span>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Create Account Column */}
				<div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
					<h4 className="font-bold text-gray-700 mb-4 border-b pb-2 text-sm uppercase flex items-center gap-2">
						<span className="text-indigo-600 font-bold text-lg">+</span> Create Account
					</h4>
					<div className="space-y-4">
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Branch</label>
							<select id="adminSiteSelect" className="w-full border p-2 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
								<option value="">-- Choose Site --</option>
								{sites.map(s => <option key={s.id} value={s.location}>{s.location}</option>)}
							</select>
						</div>
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
							<input id="adminUsername" placeholder="e.g. mumbai_admin" className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
						</div>
						<div>
							<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
							<input id="adminPassword" type="password" placeholder="••••••••" className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
						</div>
						<button
							onClick={handleCreate}
							disabled={loading}
							className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
						>
							{loading ? 'Processing...' : '+ Create Admin'}
						</button>
					</div>
				</div>

				{/* Admin List Column */}
				<div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
						<span className="text-xs font-bold text-gray-500 uppercase">Registered Admins</span>
						<button onClick={fetchData} className="text-indigo-600 text-xs font-bold hover:underline">Refresh List</button>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 border-b border-gray-100">
								<tr>
									<th className="p-3 text-left font-bold text-gray-500 uppercase text-[10px]">Site/Branch</th>
									<th className="p-3 text-left font-bold text-gray-500 uppercase text-[10px]">Username</th>
									<th className="p-3 text-center font-bold text-gray-500 uppercase text-[10px]">Logo Preview</th>
									<th className="p-3 text-center font-bold text-gray-500 uppercase text-[10px]">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-50">
								{admins.length > 0 ? (
									admins.map((admin) => (
										<tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
											<td className="p-3">
												<span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold text-[11px] border border-indigo-100">{admin.site}</span>
											</td>
											<td className="p-3 font-semibold text-gray-800">{admin.username}</td>
											<td className="p-3 text-center">
												{admin.logo ? (
													<img src={admin.logo} alt="Branch Logo" className="h-12 w-auto mx-auto object-contain" />
												) : (
													<span className="text-gray-400 text-xs italic">No logo</span>
												)}
											</td>
											<td className="p-3 text-center">
												<div className="flex gap-2 justify-center">
													<button
														onClick={() => handleEditLogo(admin)}
														className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all font-semibold text-xs border border-transparent hover:border-blue-100"
													>
														Edit Logo
													</button>
													<button
														onClick={() => handleDelete(admin.id, admin.username)}
														className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all font-semibold text-xs border border-transparent hover:border-red-100"
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={4} className="p-12 text-center text-gray-400 italic">
											<div className="text-3xl mb-2">👤</div>
											No branch admins configured yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminBranchAdmins;
